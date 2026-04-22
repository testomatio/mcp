export const listingMethods = {
  listTests({
    page,
    per_page: perPage,
    tql,
  } = {}) {
    return this.apiClient.list('tests', {
      page,
      per_page: perPage,
      tql,
    });
  },

  searchTests({ page, per_page: perPage, tql } = {}) {
    return this.listTests({
      page,
      per_page: perPage,
      tql,
    });
  },

  listSuites({ page, per_page: perPage, file_type: fileType, tag, labels, search_text: searchText } = {}) {
    return this.apiClient.list('suites', {
      page,
      per_page: perPage,
      file_type: fileType,
      tag,
      labels,
      search_text: searchText,
    });
  },

  searchSuites({ search_text: searchText, ...rest } = {}) {
    return this.listSuites({
      ...rest,
      search_text: searchText,
    });
  },

  listRuns({
    page,
    per_page: perPage,
    tql,
  } = {}) {
    return this.apiClient.list('runs', {
      page,
      per_page: perPage,
      tql,
    });
  },

  searchRuns({ page, per_page: perPage, tql } = {}) {
    return this.listRuns({ page, per_page: perPage, tql });
  },

  listTestruns({
    page,
    per_page: perPage,
    run_id: runId,
    test_ids: testIds,
    filter_status: filterStatus,
    filter_kind: filterKind,
    filter_user: filterUser,
    filter_priority: filterPriority,
    filter_substatus: filterSubstatus,
    filter_search: filterSearch,
    filter_message: filterMessage,
    filter_link: filterLink,
    filter_finished_at_date_range: filterFinishedAtDateRange,
    tags,
    labels,
    envs,
    rungroups,
    defects,
  } = {}) {
    return this.apiClient.list('testruns', {
      page,
      per_page: perPage,
      run_id: runId,
      test_ids: Array.isArray(testIds) ? testIds.join(',') : testIds,
      'filter[status]': filterStatus,
      'filter[kind]': filterKind,
      'filter[user]': filterUser,
      'filter[priority]': filterPriority,
      'filter[substatus]': filterSubstatus,
      'filter[search]': filterSearch,
      'filter[message]': filterMessage,
      'filter[link]': filterLink,
      'filter[finished_at_date_range]': filterFinishedAtDateRange,
      tags: Array.isArray(tags) ? tags.join(',') : tags,
      labels: Array.isArray(labels) ? labels.join(',') : labels,
      envs: Array.isArray(envs) ? envs.join(',') : envs,
      rungroups: Array.isArray(rungroups) ? rungroups.join(',') : rungroups,
      defects,
    });
  },

  searchTestruns({ page, per_page: perPage, run_id: runId, filter_search: filterSearch, ...rest } = {}) {
    return this.listTestruns({
      page,
      per_page: perPage,
      run_id: runId,
      filter_search: filterSearch,
      ...rest,
    });
  },

  listRungroups({ page, per_page: perPage } = {}) {
    return this.apiClient.list('rungroups', { page, per_page: perPage });
  },

  listSteps({ page, per_page: perPage } = {}) {
    return this.apiClient.list('steps', { page, per_page: perPage });
  },

  listSnippets({ page, per_page: perPage } = {}) {
    return this.apiClient.list('snippets', { page, per_page: perPage });
  },

  listLabels({ page, per_page: perPage } = {}) {
    return this.apiClient.list('labels', { page, per_page: perPage });
  },

  listPlans({ page, per_page: perPage, kind, hidden, labels, search_text: searchText } = {}) {
    return this.apiClient.list('plans', {
      page,
      per_page: perPage,
      kind,
      hidden,
      'labels[]': labels,
      search_text: searchText,
    });
  },

  searchPlans({ page, per_page: perPage, search_text: searchText, ...rest } = {}) {
    return this.listPlans({ page, per_page: perPage, search_text: searchText, ...rest });
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
