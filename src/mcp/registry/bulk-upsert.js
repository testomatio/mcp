import { parseTestsMarkdown, TESTS_BULK_LIMITS } from '../markdown/parse-tests-markdown.js';

const BULK_ENDPOINT = 'tests/bulk';
const BULK_CHUNK_SIZE = 50; // POST /tests/bulk accepts at most 50 items per request
const LIST_PAGE_SIZE = 100;
const MAX_LIST_PAGES = 10;

function normalizeUid(uid, prefixLetter) {
  const raw = String(uid || '').trim();
  const stripped = raw.replace(/^@/, '');
  if (stripped.length && stripped[0].toLowerCase() === prefixLetter.toLowerCase()) {
    return stripped.slice(1).toLowerCase();
  }
  return null;
}

function pickIdFromResponse(response) {
  return response?.data?.id ?? response?.id ?? null;
}

// The bulk endpoint expects bare public ids ("264409fe"), while the markdown
// format (and listings' uid fields, where present) uses "@T264409fe".
function barePublicId(uid, prefixLetter) {
  const normalized = normalizeUid(uid, prefixLetter);
  if (normalized) return normalized;
  const raw = String(uid || '').trim().toLowerCase();
  return raw || null;
}

function definedFields(fields) {
  const payload = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value;
    }
  }
  return payload;
}

export const bulkMethods = {
  registerBulkHandlers(handlers) {
    handlers.tests_bulk_upsert = async (args = {}) => {
      const {
        markdown,
        branch,
        dry_run: dryRun = false,
        create_missing_suites: createMissingSuites = true,
      } = args;

      if (typeof markdown !== 'string' || !markdown.trim()) {
        return this.asText({ error: 'Argument "markdown" is required and must be a non-empty string' });
      }

      const parsed = parseTestsMarkdown(markdown);
      const totalTests = parsed.suites.reduce((sum, suite) => sum + suite.tests.length, 0);
      const totalSuites = parsed.suites.length;

      if (parsed.errors.length || !totalTests) {
        return this.asText({
          error: 'Markdown could not be parsed; nothing was written',
          errors: parsed.errors,
        });
      }
      if (totalTests > TESTS_BULK_LIMITS.maxTests) {
        return this.asText({
          error: `Document contains ${totalTests} tests; the limit is ${TESTS_BULK_LIMITS.maxTests}. Split the markdown into smaller documents.`,
        });
      }
      if (totalSuites > TESTS_BULK_LIMITS.maxSuites) {
        return this.asText({
          error: `Document contains ${totalSuites} suites; the limit is ${TESTS_BULK_LIMITS.maxSuites}. Split the markdown into smaller documents.`,
        });
      }

      if (dryRun) {
        const plan = [];
        for (const suite of parsed.suites) {
          for (const test of suite.tests) {
            plan.push({ suite: suite.title, action: test.uid ? 'update' : 'create', title: test.title, uid: test.uid });
          }
        }
        return this.asText({
          dry_run: true,
          planned: {
            suites: totalSuites,
            tests: totalTests,
            creates: plan.filter(item => item.action === 'create').length,
            updates: plan.filter(item => item.action === 'update').length,
          },
          plan,
        });
      }

      return this.asText(await this.testsBulkUpsert(parsed, { branch, createMissingSuites }));
    };
  },

  async testsBulkUpsert(parsed, { branch, createMissingSuites = true } = {}) {
    const stats = {
      suites_created: 0,
      suites_reused: 0,
      tests_created: 0,
      tests_updated: 0,
      errors: 0,
    };
    const created = [];
    const updated = [];
    const errors = [];

    const suiteResults = await this.resolveSuitesForBulk(parsed.suites, { branch, createMissingSuites });

    const operations = [];
    for (const result of suiteResults) {
      if (result.skipped) continue;

      if (result.error) {
        for (const test of result.suite.tests) {
          stats.errors += 1;
          errors.push({ suite: result.suite.title, test: test.title, uid: test.uid, error: result.error });
        }
        continue;
      }

      if (result.created) stats.suites_created += 1;
      else stats.suites_reused += 1;

      for (const test of result.suite.tests) {
        operations.push({ test, suiteId: result.suiteId, suiteTitle: result.suite.title });
      }
    }

    const results = await this.dispatchBulkUpserts(operations, { branch });

    for (const result of results) {
      if (result.ok) {
        if (result.action === 'create') {
          stats.tests_created += 1;
          created.push({ title: result.test.title, uid: result.test.uid, id: result.id });
        } else {
          stats.tests_updated += 1;
          updated.push({ title: result.test.title, uid: result.test.uid, id: result.id });
        }
      } else {
        stats.errors += 1;
        errors.push({
          suite: result.suiteTitle,
          test: result.test.title,
          uid: result.test.uid,
          error: result.error,
        });
      }
    }

    const response = { stats, created, updated, errors };
    const warnings = this.collectBulkWarnings(parsed);
    if (warnings.length) response.warnings = warnings;

    return response;
  },

  collectBulkWarnings(parsed) {
    const warnings = [];
    let tagsAffected = 0;
    for (const suite of parsed.suites) {
      for (const test of suite.tests) {
        if ((test.tags && test.tags.length) || (test.labels && test.labels.length)) tagsAffected += 1;
      }
    }
    if (tagsAffected) {
      warnings.push(
        `tags/labels from the markdown were skipped: the bulk endpoint does not support them (${tagsAffected} tests affected)`
      );
    }
    return warnings;
  },

  // The suites list endpoint returns a tree: nested suites live in children.
  flattenSuiteTree(nodes, acc = []) {
    for (const node of nodes || []) {
      acc.push(node);
      if (Array.isArray(node.children) && node.children.length) this.flattenSuiteTree(node.children, acc);
    }
    return acc;
  },

  async resolveSuitesForBulk(suites, { branch, createMissingSuites = true } = {}) {
    const results = [];
    if (!suites.length) return results;

    const items = this.flattenSuiteTree(await this.listAllForBulk('suites', { branch }));
    const byUid = new Map();
    const byTitle = new Map();
    for (const item of items) {
      // listings expose the public id directly (no separate uid field); index both shapes
      const bareId = String(item.id ?? '').trim().toLowerCase();
      const uidKey = normalizeUid(item.uid, 'S') || (bareId || null);
      if (uidKey) byUid.set(uidKey, item.id);
      if (item.title) byTitle.set(String(item.title).trim().toLowerCase(), item.id);
    }

    for (const suite of suites) {
      if (!suite.tests.length) {
        results.push({ suite, skipped: true });
        continue;
      }

      let suiteId = null;
      if (suite.uid) suiteId = byUid.get(barePublicId(suite.uid, 'S')) ?? null;
      if (!suiteId && suite.title) suiteId = byTitle.get(suite.title.toLowerCase()) ?? null;

      if (suiteId) {
        results.push({ suite, suiteId });
        continue;
      }

      if (!createMissingSuites) {
        results.push({ suite, error: `Suite "${suite.title}" not found and create_missing_suites is false` });
        continue;
      }

      try {
        const response = await this.createWrapped(
          'suites',
          'suite',
          this.buildSuitePayload({ title: suite.title, description: suite.description })
        );
        const newId = pickIdFromResponse(response);
        if (!newId) throw new Error('Suite was created but the response contained no id');
        byTitle.set(suite.title.toLowerCase(), newId);
        if (suite.uid) byUid.set(barePublicId(suite.uid, 'S'), newId);
        results.push({ suite, suiteId: newId, created: true });
      } catch (error) {
        results.push({ suite, error: error?.message || String(error), status: error?.status ?? null });
      }
    }

    return results;
  },

  // The endpoint accepts at most 50 items per request; send larger documents in chunks.
  async dispatchBulkUpserts(operations, { branch }) {
    const query = branch ? { branch } : {};
    const results = [];

    for (let offset = 0; offset < operations.length; offset += BULK_CHUNK_SIZE) {
      const chunk = operations.slice(offset, offset + BULK_CHUNK_SIZE);

      let response;
      try {
        response = await this.apiClient.createWithQuery(BULK_ENDPOINT, {
          query,
          body: { tests: chunk.map(operation => this.buildBulkTestPayload(operation)) },
        });
      } catch (error) {
        // Request-level failure (e.g. 422) fails the whole chunk.
        for (const operation of chunk) {
          results.push({
            ...operation,
            ok: false,
            error: `Bulk endpoint failed: ${error?.message || String(error)}`,
          });
        }
        continue;
      }

      const items = Array.isArray(response) ? response : (response?.data ?? []);
      chunk.forEach((operation, index) => {
        results.push(this.mapBulkEndpointResult(operation, items[index]));
      });
    }

    return results;
  },

  mapBulkEndpointResult(operation, item) {
    // Failure items carry the original input plus an error; treat any error
    // shape (string or object) as a failure, not only the documented ones.
    const rawError = item?.error;
    if (rawError !== undefined && rawError !== null) {
      const message =
        typeof rawError === 'string' ? rawError : (rawError.message || JSON.stringify(rawError));
      return { ...operation, ok: false, error: message };
    }

    if (!item || typeof item !== 'object') {
      return { ...operation, ok: false, error: 'Bulk endpoint returned no result for this test' };
    }

    return {
      ...operation,
      ok: true,
      action: operation.test.uid ? 'update' : 'create',
      id: item.id ?? null,
      status: item.status ?? null,
    };
  },

  buildBulkTestPayload({ test, suiteId }) {
    const bareId = test.uid ? barePublicId(test.uid, 'T') : null;
    return {
      ...(bareId ? { id: bareId } : {}),
      ...definedFields({
        title: test.title,
        description: test.description,
        suite_id: suiteId,
        priority: test.priority,
        assigned_to: test.assignee,
        state: test.state,
      }),
    };
  },

  async listAllForBulk(resource, { branch, query = {} } = {}) {
    const items = [];
    for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
      const response = await this.apiClient.list(resource, {
        ...query,
        per_page: LIST_PAGE_SIZE,
        page,
        ...(branch ? { branch } : {}),
      });
      const data = Array.isArray(response?.data) ? response.data : [];
      items.push(...data);

      const meta = response?.meta;
      let hasMore;
      if (typeof meta?.has_more === 'boolean') hasMore = meta.has_more;
      else if (typeof meta?.total === 'number') hasMore = page * LIST_PAGE_SIZE < meta.total;
      else hasMore = data.length === LIST_PAGE_SIZE;
      if (!hasMore) return items;
    }
    // Truncating here would silently miss suites and create duplicates on
    // lookup — fail loudly instead of guessing.
    throw new Error(
      `Listing "${resource}" exceeded ${MAX_LIST_PAGES} pages; cannot resolve suites safely. Split the markdown or narrow the project.`
    );
  },
};
