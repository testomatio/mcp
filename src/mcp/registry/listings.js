export const listingMethods = {
  listTests({
    page,
    per_page: perPage,
    tql,
    count,
    group_by: groupBy,
    slim,
  } = {}) {
    return this.apiClient.list('tests', {
      page,
      per_page: perPage,
      tql,
      count,
      group_by: groupBy,
      slim,
    });
  },

  listSuites({ page, per_page: perPage, file_type: fileType, tag, labels, search_text: searchText, count, slim } = {}) {
    return this.apiClient.list('suites', {
      page,
      per_page: perPage,
      file_type: fileType,
      tag,
      labels,
      search_text: searchText,
      count,
      slim,
    });
  },

  listRuns({
    page,
    per_page: perPage,
    tql,
    count,
    group_by: groupBy,
    slim,
  } = {}) {
    return this.apiClient.list('runs', {
      page,
      per_page: perPage,
      tql,
      count,
      group_by: groupBy,
      slim,
    });
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
    count,
    group_by: groupBy,
    slim,
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
      count,
      group_by: groupBy,
      slim,
    });
  },

  listRungroups({ page, per_page: perPage, count, slim } = {}) {
    return this.apiClient.list('rungroups', { page, per_page: perPage, count, slim });
  },

  listSteps({ page, per_page: perPage, count, slim } = {}) {
    return this.apiClient.list('steps', { page, per_page: perPage, count, slim });
  },

  listSnippets({ page, per_page: perPage, count, slim } = {}) {
    return this.apiClient.list('snippets', { page, per_page: perPage, count, slim });
  },

  listLabels({ page, per_page: perPage, count, slim } = {}) {
    return this.apiClient.list('labels', { page, per_page: perPage, count, slim });
  },

  listPlans({ page, per_page: perPage, kind, hidden, labels, search_text: searchText, count, slim } = {}) {
    return this.apiClient.list('plans', {
      page,
      per_page: perPage,
      kind,
      hidden,
      'labels[]': labels,
      search_text: searchText,
      count,
      slim,
    });
  },

  listRequirements({ page, per_page: perPage, source, scope, count, group_by: groupBy, slim } = {}) {
    return this.apiClient.list('requirements', { page, per_page: perPage, source, scope, count, group_by: groupBy, slim });
  },

  listMilestones({ page, per_page: perPage, type, status, count, slim } = {}) {
    return this.apiClient.list('milestones', { page, per_page: perPage, type, status, count, slim });
  },

  listTags({ count, slim } = {}) {
    return this.apiClient.list('tags', { count, slim });
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
