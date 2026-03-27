export const listingMethods = {
  listTests({ page, per_page: perPage, suite_id: suiteId, search_text: searchText, query, ...filters } = {}) {
    return this.apiClient.list('tests', {
      page,
      per_page: perPage,
      suite_id: suiteId,
      search_text: searchText || query,
      ...filters,
    });
  },

  searchTests({ query, search_text: searchText, ...rest } = {}) {
    return this.listTests({
      ...rest,
      search_text: searchText || query,
    });
  },

  listSuites({ page, per_page: perPage, file_type: fileType, tag, labels, search_text: searchText, query } = {}) {
    return this.apiClient.list('suites', {
      page,
      per_page: perPage,
      file_type: fileType,
      tag,
      labels,
      search_text: searchText || query,
    });
  },

  searchSuites({ query, search_text: searchText, ...rest } = {}) {
    return this.listSuites({
      ...rest,
      search_text: searchText || query,
    });
  },

  listRuns({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('runs', { page, per_page: perPage, query });
  },

  searchRuns({ page, per_page: perPage, query } = {}) {
    return this.listRuns({ page, per_page: perPage, query });
  },

  listTestruns({ page, per_page: perPage, run_id: runId, query } = {}) {
    return this.apiClient.list('testruns', { page, per_page: perPage, run_id: runId, query });
  },

  searchTestruns({ page, per_page: perPage, run_id: runId, query } = {}) {
    return this.listTestruns({ page, per_page: perPage, run_id: runId, query });
  },

  listRungroups({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('rungroups', { page, per_page: perPage, query });
  },

  searchRungroups({ page, per_page: perPage, query } = {}) {
    return this.listRungroups({ page, per_page: perPage, query });
  },

  listSteps({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('steps', { page, per_page: perPage, query });
  },

  searchSteps({ page, per_page: perPage, query } = {}) {
    return this.listSteps({ page, per_page: perPage, query });
  },

  listSnippets({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('snippets', { page, per_page: perPage, query });
  },

  searchSnippets({ page, per_page: perPage, query } = {}) {
    return this.listSnippets({ page, per_page: perPage, query });
  },

  listLabels({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('labels', { page, per_page: perPage, query });
  },

  searchLabels({ page, per_page: perPage, query } = {}) {
    return this.listLabels({ page, per_page: perPage, query });
  },

  listPlans({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('plans', { page, per_page: perPage, query });
  },

  searchPlans({ page, per_page: perPage, query } = {}) {
    return this.listPlans({ page, per_page: perPage, query });
  },

  listTags() {
    return this.apiClient.list('tags');
  },

  getTagByTitle(tagId) {
    return this.apiClient.get('tags', tagId);
  },

  searchTags({ tag_id: tagId, query } = {}) {
    const resolvedTag = tagId || query;
    if (!resolvedTag) {
      throw new Error('Provide "tag_id" or "query" for tags_search.');
    }
    return this.getTagByTitle(resolvedTag);
  },
};
