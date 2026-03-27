import { ISSUE_RESOURCE_KEYS } from '../configs/issues-config.js';

export const issueMethods = {
  listIssues({ page, per_page: perPage, source, ...resourceQuery } = {}) {
    this.validateIssueResourceQuery(resourceQuery, { allowEmpty: true, allowMany: false });
    return this.listIssuesForResource({
      ...resourceQuery,
      page,
      per_page: perPage,
      source,
    });
  },

  searchIssues(args = {}) {
    return this.listIssues(args);
  },

  createIssue({ url, jira_id: jiraId, ...resourceQuery } = {}) {
    this.validateIssueResourceQuery(resourceQuery, { allowEmpty: false, allowMany: false });
    return this.linkIssueToResource({
      ...resourceQuery,
      url,
      jira_id: jiraId,
    });
  },

  listIssuesForResource({ page, per_page: perPage, source, ...resourceQuery } = {}) {
    return this.apiClient.list('issues', {
      ...resourceQuery,
      page,
      per_page: perPage,
      source,
    });
  },

  listIssuesForKey({ resourceKey, resourceId, page, per_page: perPage, source }) {
    this.assertSupportedIssueResourceKey(resourceKey);
    return this.listIssuesForResource({
      [resourceKey]: resourceId,
      page,
      per_page: perPage,
      source,
    });
  },

  linkIssueForKey({ resourceKey, resourceId, url, jira_id: jiraId }) {
    this.assertSupportedIssueResourceKey(resourceKey);
    return this.linkIssueToResource({
      [resourceKey]: resourceId,
      url,
      jira_id: jiraId,
    });
  },

  linkIssueToResource({ url, jira_id: jiraId, ...resourceQuery } = {}) {
    if (Boolean(url) === Boolean(jiraId)) {
      throw new Error('Provide exactly one field: "url" or "jira_id".');
    }
    this.validateIssueResourceQuery(resourceQuery, { allowEmpty: false, allowMany: false });

    const payload = { url, jira_id: jiraId };
    return this.createIssueWithFallback(resourceQuery, payload);
  },

  async createIssueWithFallback(resourceQuery, payload) {
    try {
      return await this.apiClient.createWithQuery('issues', {
        query: resourceQuery,
        body: payload,
      });
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, 'issue')) {
        throw error;
      }
      return this.apiClient.createWithQuery('issues', {
        query: resourceQuery,
        body: { issue: payload },
      });
    }
  },

  assertSupportedIssueResourceKey(resourceKey) {
    if (!ISSUE_RESOURCE_KEYS.includes(resourceKey)) {
      throw new Error(`Unsupported issue resource key: ${resourceKey}`);
    }
  },

  validateIssueResourceQuery(resourceQuery = {}, { allowEmpty = false, allowMany = false } = {}) {
    const provided = ISSUE_RESOURCE_KEYS.filter((key) => {
      const value = resourceQuery[key];
      return value !== undefined && value !== null && value !== '';
    });

    if (!allowEmpty && provided.length === 0) {
      throw new Error(`Provide one resource id: ${ISSUE_RESOURCE_KEYS.join(', ')}.`);
    }

    if (!allowMany && provided.length > 1) {
      throw new Error(
        `Provide only one resource id at a time: ${ISSUE_RESOURCE_KEYS.join(', ')}.`
      );
    }

    return provided;
  },
};
