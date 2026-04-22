import { ENTITY_CRUD_CONFIGS } from '../configs/entity-crud-config.js';
import { ISSUE_SCOPED_TOOL_CONFIGS } from '../configs/issues-config.js';

export const handlerMethods = {
  registerEntityCrudHandlers(handlers) {
    for (const spec of ENTITY_CRUD_CONFIGS) {
      const { toolPrefix, resource, idArg, listMethod, searchMethod } = spec;

      handlers[`${toolPrefix}_list`] = async (args = {}) =>
        this.asText(await this[listMethod](args));
      if (searchMethod) {
        handlers[`${toolPrefix}_search`] = async (args = {}) =>
          this.asText(await this[searchMethod](args));
      }
      handlers[`${toolPrefix}_get`] = async (args = {}) =>
        this.asText(await this.apiClient.get(resource, this.pickRequiredArg(args, idArg)));
      handlers[`${toolPrefix}_create`] = async (args = {}) =>
        this.asText(await this.executeCreate(spec, args));
      handlers[`${toolPrefix}_update`] = async (args = {}) => {
        const id = this.pickRequiredArg(args, idArg);
        const payloadArgs = this.omitArg(args, idArg);
        return this.asText(await this.executeUpdate(spec, id, payloadArgs));
      };
      handlers[`${toolPrefix}_delete`] = async (args = {}) =>
        this.asText(await this.apiClient.delete(resource, this.pickRequiredArg(args, idArg)));
    }
  },

  registerScopedIssueHandlers(handlers) {
    for (const { toolPrefix, resourceKey } of ISSUE_SCOPED_TOOL_CONFIGS) {
      handlers[`${toolPrefix}_issues_list`] = async (args = {}) =>
        this.asText(
          await this.listIssuesForKey({
            resourceKey,
            resourceId: this.pickRequiredArg(args, resourceKey),
            page: args.page,
            per_page: args.per_page,
            source: args.source,
          })
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

  registerGlobalHandlers(handlers) {
    handlers.tags_list = async () => this.asText(await this.listTags());
    handlers.tags_get = async ({ tag_id: tagId }) => this.asText(await this.getTagByTitle(tagId));
    handlers.tags_search = async (args = {}) => this.asText(await this.searchTags(args));

    handlers.issues_list = async (args = {}) => this.asText(await this.listIssues(args));
    handlers.issues_search = async (args = {}) => this.asText(await this.searchIssues(args));
    handlers.issues_create = async (args = {}) => this.asText(await this.createIssue(args));
    handlers.issues_delete = async ({ issue_id: issueId, type }) =>
      this.asText(await this.apiClient.delete('issues', issueId, { type }));
  },

  pickRequiredArg(args = {}, key) {
    const value = args[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing required argument: ${key}`);
    }
    return value;
  },

  omitArg(args = {}, key) {
    const payload = { ...args };
    delete payload[key];
    return payload;
  },

  executeCreate(spec, args = {}) {
    if (spec.createMode === 'run') {
      return this.createRunWithFallback(args);
    }
    const payload = this[spec.payloadBuilder](args);
    return this.createWrapped(spec.resource, spec.wrapperKey, payload);
  },

  executeUpdate(spec, id, args = {}) {
    if (spec.updateMode === 'run') {
      return this.updateRunWithFallback(id, args);
    }
    const payload = this[spec.payloadBuilder](args);
    return this.updateWrapped(spec.resource, id, spec.wrapperKey, payload);
  },
};
