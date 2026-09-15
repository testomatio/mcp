import { ENTITY_CRUD_CONFIGS } from '../configs/entity-crud-config.js';
import { ATTACHMENT_SCOPED_TOOL_CONFIGS } from '../configs/attachments-config.js';
import { ISSUE_SCOPED_TOOL_CONFIGS } from '../configs/issues-config.js';
import { backendSlimQuery, slimList } from '../list-projection.js';
import { parseTestsMarkdown, TESTS_BULK_LIMITS } from '../markdown/parse-tests-markdown.js';

export const handlerMethods = {
  registerEntityCrudHandlers(handlers) {
    for (const spec of ENTITY_CRUD_CONFIGS) {
      const { toolPrefix, resource, idArg, listMethod } = spec;

      handlers[`${toolPrefix}_list`] = async (args = {}) => {
        const { verbose, fields, ...listArgs } = args;
        Object.assign(listArgs, backendSlimQuery({ verbose, fields, count: listArgs.count }));
        return this.asText(
          slimList(await this[listMethod](listArgs), {
            verbose,
            fields,
            entity: toolPrefix,
          })
        );
      };
      handlers[`${toolPrefix}_get`] = async (args = {}) => {
        const id = this.pickRequiredArg(args, idArg);
        return this.asText(
          await this.apiClient.get(resource, id, this.pickQueryArgs(spec, args))
        );
      };
      handlers[`${toolPrefix}_create`] = async (args = {}) => {
        const { query, payloadArgs } = this.splitQueryArgs(spec, args);
        return this.asText(await this.executeCreate(spec, payloadArgs, query));
      };
      handlers[`${toolPrefix}_update`] = async (args = {}) => {
        const id = this.pickRequiredArg(args, idArg);
        const { query, payloadArgs } = this.splitQueryArgs(spec, this.omitArgs(args, [idArg]));
        return this.asText(await this.executeUpdate(spec, id, payloadArgs, query));
      };
      handlers[`${toolPrefix}_delete`] = async (args = {}) => {
        const id = this.pickRequiredArg(args, idArg);
        return this.asText(
          await this.apiClient.delete(resource, id, this.pickQueryArgs(spec, args))
        );
      };
    }
  },

  registerScopedIssueHandlers(handlers) {
    for (const { toolPrefix, resourceKey } of ISSUE_SCOPED_TOOL_CONFIGS) {
      handlers[`${toolPrefix}_issues_list`] = async (args = {}) =>
        this.asText(
          slimList(
            await this.listIssuesForKey({
              resourceKey,
              resourceId: this.pickRequiredArg(args, resourceKey),
              page: args.page,
              per_page: args.per_page,
              source: args.source,
              ...backendSlimQuery(args),
            }),
            { verbose: args.verbose, fields: args.fields, entity: 'issues' }
          )
        );

      handlers[`${toolPrefix}_issues_link`] = async (args = {}) =>
        this.asText(
          await this.linkIssueForKey({
            resourceKey,
            resourceId: this.pickRequiredArg(args, resourceKey),
            url: args.url,
            jira_id: args.jira_id,
          })
        );

      handlers[`${toolPrefix}_issues_unlink`] = async ({ issue_id: issueId, type }) =>
        this.asText(await this.apiClient.delete('issues', issueId, { type }));
    }
  },

  registerScopedAttachmentHandlers(handlers) {
    for (const { toolPrefix, resourceKey } of ATTACHMENT_SCOPED_TOOL_CONFIGS) {
      handlers[`${toolPrefix}_attachments_list`] = async (args = {}) =>
        this.asText(
          slimList(
            await this.listAttachmentsForKey({
              resourceKey,
              resourceId: this.pickRequiredArg(args, resourceKey),
              ...backendSlimQuery(args),
            }),
            { verbose: args.verbose, fields: args.fields, entity: 'attachments' }
          )
        );

      handlers[`${toolPrefix}_attachments_upload`] = async (args = {}) =>
        this.asText(
          await this.uploadAttachmentForKey({
            resourceKey,
            resourceId: this.pickRequiredArg(args, resourceKey),
            filePath: this.pickRequiredArg(args, 'file_path'),
          })
        );

      handlers[`${toolPrefix}_attachments_delete`] = async (args = {}) =>
        this.asText(
          await this.deleteAttachmentForKey({
            resourceKey,
            resourceId: this.pickRequiredArg(args, resourceKey),
            attachmentId: this.pickRequiredArg(args, 'attachment_id'),
          })
        );
    }
  },

  registerGlobalHandlers(handlers) {
    handlers.project_info = async () => this.asText(await this.apiClient.get('info'));

    handlers.tags_list = async (args = {}) => {
      const { verbose, fields, ...listArgs } = args;
      Object.assign(listArgs, backendSlimQuery({ verbose, fields, count: listArgs.count }));
      return this.asText(slimList(await this.listTags(listArgs), { ...args, entity: 'tags' }));
    };
    handlers.tags_get = async ({ tag_id: tagId }) => this.asText(await this.getTagByTitle(tagId));

    handlers.milestones_list = async (args = {}) => {
      const { verbose, fields, ...listArgs } = args;
      Object.assign(listArgs, backendSlimQuery({ verbose, fields, count: listArgs.count }));
      return this.asText(
        slimList(await this.listMilestones(listArgs), { verbose, fields, entity: 'milestones' })
      );
    };
    handlers.milestones_get = async ({ milestone_id: milestoneId }) =>
      this.asText(await this.apiClient.get('milestones', milestoneId));

    handlers.issues_list = async (args = {}) => {
      const { verbose, fields, ...listArgs } = args;
      Object.assign(listArgs, backendSlimQuery({ verbose, fields, count: listArgs.count }));
      return this.asText(
        slimList(await this.listIssues(listArgs), { verbose, fields, entity: 'issues' })
      );
    };
    handlers.issues_create = async (args = {}) => this.asText(await this.createIssue(args));
    handlers.issues_delete = async ({ issue_id: issueId, type }) =>
      this.asText(await this.apiClient.delete('issues', issueId, { type }));

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

  pickRequiredArg(args = {}, key) {
    const value = args[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing required argument: ${key}`);
    }
    return value;
  },

  omitArgs(args = {}, keys) {
    const payload = { ...args };
    for (const key of keys) {
      delete payload[key];
    }
    return payload;
  },

  /**
   * Extract the entity's query args (spec.queryArgs, e.g. branch) from tool args
   * without knowing their names in the handlers.
   */
  splitQueryArgs(spec, args = {}) {
    const queryArgs = spec.queryArgs || [];
    const query = {};
    const payloadArgs = { ...args };
    for (const key of queryArgs) {
      if (args[key] !== undefined) {
        query[key] = args[key];
        delete payloadArgs[key];
      }
    }
    return { query, payloadArgs };
  },

  pickQueryArgs(spec, args = {}) {
    const { query } = this.splitQueryArgs(spec, args);
    return query;
  },

  executeCreate(spec, args = {}, query = {}) {
    if (spec.createMode === 'run') {
      return this.createRunWithFallback(args, query);
    }
    if (spec.createMode === 'requirement') {
      return this.createRequirement(args, query);
    }
    const payload = this[spec.payloadBuilder](args);
    return this.createWrapped(spec.resource, spec.wrapperKey, payload, query);
  },

  executeUpdate(spec, id, args = {}, query = {}) {
    if (spec.updateMode === 'run') {
      return this.updateRunWithFallback(id, args, query);
    }
    if (spec.updateMode === 'requirement') {
      return this.updateRequirement(id, args, query);
    }
    const payload = this[spec.payloadBuilder](args);
    if (spec.updateMethod === 'patch') {
      return this.patchWrapped(spec.resource, id, spec.wrapperKey, payload, query);
    }
    return this.updateWrapped(spec.resource, id, spec.wrapperKey, payload, query);
  },
};
