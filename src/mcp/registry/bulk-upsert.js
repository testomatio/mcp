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

export const bulkMethods = {
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
          errors.push({ suite: result.suite.title, test: test.title, uid: test.uid, error: result.error, status: result.status ?? null });
        }
        stats.errors += result.suite.tests.length;
        continue;
      }

      if (result.created) stats.suites_created += 1;
      else stats.suites_reused += 1;

      for (const test of result.suite.tests) {
        operations.push({
          action: test.uid ? 'update' : 'create',
          test,
          suiteId: result.suiteId,
          suiteTitle: result.suite.title,
        });
      }
    }

    const results = await this.dispatchTestUpserts(operations, { branch });

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
          status: result.status ?? null,
          details: result.details ?? null,
        });
      }
    }

    return { stats, created, updated, errors };
  },

  async resolveSuitesForBulk(suites, { branch, createMissingSuites = true } = {}) {
    const results = [];
    if (!suites.length) return results;

    const items = await this.listAllForBulk('suites', { branch });
    const byUid = new Map();
    const byTitle = new Map();
    for (const item of items) {
      const uidKey = normalizeUid(item.uid, 'S');
      if (uidKey) byUid.set(uidKey, item.id);
      if (item.title) byTitle.set(String(item.title).trim().toLowerCase(), item.id);
    }

    for (const suite of suites) {
      if (!suite.tests.length) {
        results.push({ suite, skipped: true });
        continue;
      }

      let suiteId = null;
      if (suite.uid) suiteId = byUid.get(normalizeUid(suite.uid, 'S')) ?? null;
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
        if (suite.uid) byUid.set(normalizeUid(suite.uid, 'S'), newId);
        results.push({ suite, suiteId: newId, created: true });
      } catch (error) {
        results.push({ suite, error: error?.message || String(error), status: error?.status ?? null });
      }
    }

    return results;
  },

  // POST /api/v2/{project}/tests/bulk when available; sequential loop otherwise
  async dispatchTestUpserts(operations, { branch }) {
    const query = branch ? { branch } : {};

    try {
      const response = await this.apiClient.createWithQuery('tests/bulk', {
        query,
        body: {
          tests: operations.map(operation => ({
            ...(operation.test.uid ? { id: operation.test.uid } : {}),
            ...this.buildBulkTestPayload(operation.test, operation.suiteId),
          })),
        },
      });
      return this.mapBulkEndpointResults(operations, response);
    } catch (error) {
      if (![404, 405, 501].includes(error?.status)) {
        return operations.map(operation => ({
          ...operation,
          ok: false,
          error: `Bulk endpoint failed: ${error?.message || String(error)}`,
          status: error?.status ?? null,
          details: error?.payload ?? null,
        }));
      }
    }

    return this.dispatchTestUpsertsSequentially(operations, { branch });
  },

  mapBulkEndpointResults(operations, response) {
    const items = Array.isArray(response) ? response : (response?.data ?? response?.results ?? []);
    return operations.map((operation, index) => {
      const item = items[index] ?? {};
      const id = item.id ?? item.test_id ?? null;
      const itemError = item.error?.message || (typeof item.error === 'string' ? item.error : null);

      if (itemError || ['error', 'failed'].includes(item.status)) {
        return {
          ...operation,
          ok: false,
          error: itemError || 'Bulk operation failed',
          status: typeof item.status === 'number' ? item.status : null,
          details: item,
        };
      }

      return { action: operation.action, test: operation.test, suiteTitle: operation.suiteTitle, ok: true, id };
    });
  },

  async dispatchTestUpsertsSequentially(operations, { branch }) {
    const state = {};
    const results = [];

    for (const operation of operations) {
      try {
        results.push(await this.upsertSingleTest(operation, { branch, state }));
      } catch (error) {
        results.push({
          ...operation,
          ok: false,
          error: error?.message || String(error),
          status: error?.status ?? null,
          details: error?.payload ?? null,
        });
      }
    }

    return results;
  },

  async upsertSingleTest({ action, test, suiteId, suiteTitle }, { branch, state }) {
    const payload = this.buildBulkTestPayload(test, suiteId);
    const query = branch ? { branch } : {};

    if (action === 'create') {
      const response = await this.createWrapped('tests', 'test', payload, query);
      return { action, test, suiteTitle, ok: true, id: pickIdFromResponse(response) };
    }

    // try the @T uid as the path id, fall back to a uid → id lookup on 404
    try {
      const response = await this.updateWrapped('tests', test.uid, 'test', payload, query);
      return { action, test, suiteTitle, ok: true, id: pickIdFromResponse(response) };
    } catch (error) {
      if (error?.status !== 404) throw error;
    }

    const testId = await this.resolveTestIdForBulk(test.uid, { branch, state });
    if (!testId) {
      const notFound = new Error(
        `Test ${test.uid} not found (deleted or on another branch); remove its id from the markdown to re-create it`
      );
      notFound.status = 404;
      throw notFound;
    }

    const response = await this.updateWrapped('tests', testId, 'test', payload, query);
    return { action, test, suiteTitle, ok: true, id: pickIdFromResponse(response) ?? testId };
  },

  async resolveTestIdForBulk(uid, { branch, state }) {
    if (!state.testIdIndex) {
      const items = await this.listAllForBulk('tests', { branch });
      const index = new Map();
      for (const item of items) {
        const key = normalizeUid(item.uid, 'T');
        if (key) index.set(key, item.id);
      }
      state.testIdIndex = index;
    }
    return state.testIdIndex.get(normalizeUid(uid, 'T')) ?? null;
  },

  buildBulkTestPayload(test, suiteId) {
    const link = [];
    for (const tag of test.tags) {
      link.push({ action: 'add', type: 'tag', value: tag });
    }
    for (const label of test.labels) {
      link.push({ action: 'add', type: 'label', value: label });
    }

    return this.buildTestPayload({
      title: test.title,
      suite_id: suiteId,
      description: test.description,
      priority: test.priority,
      state: test.state,
      assigned_to: test.assignee,
      link: link.length ? link : undefined,
    });
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
      if (!hasMore) break;
    }
    return items;
  },
};
