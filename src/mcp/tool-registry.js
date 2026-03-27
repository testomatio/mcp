import { DEFAULT_TOOL_RESPONSE } from '../config/constants.js';
import { ApiError, NotImplementedToolError } from '../core/errors.js';
import { textResponse } from '../helpers/mcp-response.js';
import { TOOL_DEFINITIONS } from './tool-definitions.js';

const ISSUE_RESOURCE_KEYS = ['test_id', 'suite_id', 'run_id', 'testrun_id', 'plan_id'];

function formatJson(payload) {
  return JSON.stringify(payload, null, 2);
}

export class ToolRegistry {
  constructor({ config, apiClient, logger }) {
    this.config = config;
    this.apiClient = apiClient;
    this.logger = logger;
    this.handlers = this.buildHandlers();
  }

  buildHandlers() {
    const handlers = {
      system_ping: async () =>
        textResponse(
          formatJson({
            status: 'ok',
            projectId: this.config.projectId,
            baseUrl: this.config.baseUrl,
            apiVersion: 'v2',
          })
        ),
      tests_list: async (args = {}) => textResponse(formatJson(await this.listTests(args))),
      tests_search: async (args = {}) => textResponse(formatJson(await this.searchTests(args))),
      tests_get: async ({ test_id: testId }) =>
        textResponse(formatJson(await this.apiClient.get('tests', testId))),
      tests_create: async (args = {}) =>
        textResponse(formatJson(await this.createWrapped('tests', 'test', this.buildTestPayload(args)))),
      tests_update: async ({ test_id: testId, ...args }) =>
        textResponse(
          formatJson(await this.updateWrapped('tests', testId, 'test', this.buildTestPayload(args)))
        ),
      tests_delete: async ({ test_id: testId }) =>
        textResponse(formatJson(await this.apiClient.delete('tests', testId))),
      tests_issues_list: async ({ test_id: testId, page, per_page: perPage, source }) =>
        textResponse(
          formatJson(
            await this.listIssuesForKey({
              resourceKey: 'test_id',
              resourceId: testId,
              page,
              per_page: perPage,
              source,
            })
          )
        ),
      tests_issues_link: async ({ test_id: testId, url, jira_id: jiraId }) =>
        textResponse(
          formatJson(
            await this.linkIssueForKey({
              resourceKey: 'test_id',
              resourceId: testId,
              url,
              jira_id: jiraId,
            })
          )
        ),
      tests_issues_unlink: async ({ issue_id: issueId, type }) =>
        textResponse(formatJson(await this.apiClient.delete('issues', issueId, { type }))),
      suites_list: async (args = {}) => textResponse(formatJson(await this.listSuites(args))),
      suites_search: async (args = {}) => textResponse(formatJson(await this.searchSuites(args))),
      suites_get: async ({ suite_id: suiteId }) =>
        textResponse(formatJson(await this.apiClient.get('suites', suiteId))),
      suites_create: async (args = {}) =>
        textResponse(
          formatJson(await this.createWrapped('suites', 'suite', this.buildSuitePayload(args)))
        ),
      suites_update: async ({ suite_id: suiteId, ...args }) =>
        textResponse(
          formatJson(await this.updateWrapped('suites', suiteId, 'suite', this.buildSuitePayload(args)))
        ),
      suites_delete: async ({ suite_id: suiteId }) =>
        textResponse(formatJson(await this.apiClient.delete('suites', suiteId))),
      suites_issues_list: async ({ suite_id: suiteId, page, per_page: perPage, source }) =>
        textResponse(
          formatJson(
            await this.listIssuesForKey({
              resourceKey: 'suite_id',
              resourceId: suiteId,
              page,
              per_page: perPage,
              source,
            })
          )
        ),
      suites_issues_link: async ({ suite_id: suiteId, url, jira_id: jiraId }) =>
        textResponse(
          formatJson(
            await this.linkIssueForKey({
              resourceKey: 'suite_id',
              resourceId: suiteId,
              url,
              jira_id: jiraId,
            })
          )
        ),
      suites_issues_unlink: async ({ issue_id: issueId, type }) =>
        textResponse(formatJson(await this.apiClient.delete('issues', issueId, { type }))),
      runs_list: async (args = {}) => textResponse(formatJson(await this.listRuns(args))),
      runs_search: async (args = {}) => textResponse(formatJson(await this.searchRuns(args))),
      runs_get: async ({ run_id: runId }) =>
        textResponse(formatJson(await this.apiClient.get('runs', runId))),
      runs_create: async (args = {}) =>
        textResponse(formatJson(await this.createRunWithFallback(args))),
      runs_update: async ({ run_id: runId, ...args }) =>
        textResponse(formatJson(await this.updateRunWithFallback(runId, args))),
      runs_delete: async ({ run_id: runId }) =>
        textResponse(formatJson(await this.apiClient.delete('runs', runId))),
      runs_issues_list: async ({ run_id: runId, page, per_page: perPage, source }) =>
        textResponse(
          formatJson(
            await this.listIssuesForKey({
              resourceKey: 'run_id',
              resourceId: runId,
              page,
              per_page: perPage,
              source,
            })
          )
        ),
      runs_issues_link: async ({ run_id: runId, url, jira_id: jiraId }) =>
        textResponse(
          formatJson(
            await this.linkIssueForKey({
              resourceKey: 'run_id',
              resourceId: runId,
              url,
              jira_id: jiraId,
            })
          )
        ),
      runs_issues_unlink: async ({ issue_id: issueId, type }) =>
        textResponse(formatJson(await this.apiClient.delete('issues', issueId, { type }))),
      testruns_list: async (args = {}) => textResponse(formatJson(await this.listTestruns(args))),
      testruns_search: async (args = {}) => textResponse(formatJson(await this.searchTestruns(args))),
      testruns_get: async ({ testrun_id: testrunId }) =>
        textResponse(formatJson(await this.apiClient.get('testruns', testrunId))),
      testruns_create: async (args = {}) =>
        textResponse(
          formatJson(await this.createWrapped('testruns', 'testrun', this.buildTestrunPayload(args)))
        ),
      testruns_update: async ({ testrun_id: testrunId, ...args }) =>
        textResponse(
          formatJson(
            await this.updateWrapped('testruns', testrunId, 'testrun', this.buildTestrunPayload(args))
          )
        ),
      testruns_delete: async ({ testrun_id: testrunId }) =>
        textResponse(formatJson(await this.apiClient.delete('testruns', testrunId))),
      testruns_issues_list: async ({ testrun_id: testrunId, page, per_page: perPage, source }) =>
        textResponse(
          formatJson(
            await this.listIssuesForKey({
              resourceKey: 'testrun_id',
              resourceId: testrunId,
              page,
              per_page: perPage,
              source,
            })
          )
        ),
      testruns_issues_link: async ({ testrun_id: testrunId, url, jira_id: jiraId }) =>
        textResponse(
          formatJson(
            await this.linkIssueForKey({
              resourceKey: 'testrun_id',
              resourceId: testrunId,
              url,
              jira_id: jiraId,
            })
          )
        ),
      testruns_issues_unlink: async ({ issue_id: issueId, type }) =>
        textResponse(formatJson(await this.apiClient.delete('issues', issueId, { type }))),
      rungroups_list: async (args = {}) => textResponse(formatJson(await this.listRungroups(args))),
      rungroups_search: async (args = {}) => textResponse(formatJson(await this.searchRungroups(args))),
      rungroups_get: async ({ rungroup_id: rungroupId }) =>
        textResponse(formatJson(await this.apiClient.get('rungroups', rungroupId))),
      rungroups_create: async (args = {}) =>
        textResponse(
          formatJson(
            await this.createWrapped('rungroups', 'rungroup', this.buildRungroupPayload(args))
          )
        ),
      rungroups_update: async ({ rungroup_id: rungroupId, ...args }) =>
        textResponse(
          formatJson(
            await this.updateWrapped(
              'rungroups',
              rungroupId,
              'rungroup',
              this.buildRungroupPayload(args)
            )
          )
        ),
      rungroups_delete: async ({ rungroup_id: rungroupId }) =>
        textResponse(formatJson(await this.apiClient.delete('rungroups', rungroupId))),
      steps_list: async (args = {}) => textResponse(formatJson(await this.listSteps(args))),
      steps_search: async (args = {}) => textResponse(formatJson(await this.searchSteps(args))),
      steps_get: async ({ step_id: stepId }) =>
        textResponse(formatJson(await this.apiClient.get('steps', stepId))),
      steps_create: async (args = {}) =>
        textResponse(formatJson(await this.createWrapped('steps', 'step', this.buildStepPayload(args)))),
      steps_update: async ({ step_id: stepId, ...args }) =>
        textResponse(
          formatJson(await this.updateWrapped('steps', stepId, 'step', this.buildStepPayload(args)))
        ),
      steps_delete: async ({ step_id: stepId }) =>
        textResponse(formatJson(await this.apiClient.delete('steps', stepId))),
      snippets_list: async (args = {}) => textResponse(formatJson(await this.listSnippets(args))),
      snippets_search: async (args = {}) => textResponse(formatJson(await this.searchSnippets(args))),
      snippets_get: async ({ snippet_id: snippetId }) =>
        textResponse(formatJson(await this.apiClient.get('snippets', snippetId))),
      snippets_create: async (args = {}) =>
        textResponse(
          formatJson(await this.createWrapped('snippets', 'snippet', this.buildSnippetPayload(args)))
        ),
      snippets_update: async ({ snippet_id: snippetId, ...args }) =>
        textResponse(
          formatJson(
            await this.updateWrapped('snippets', snippetId, 'snippet', this.buildSnippetPayload(args))
          )
        ),
      snippets_delete: async ({ snippet_id: snippetId }) =>
        textResponse(formatJson(await this.apiClient.delete('snippets', snippetId))),
      labels_list: async (args = {}) => textResponse(formatJson(await this.listLabels(args))),
      labels_search: async (args = {}) => textResponse(formatJson(await this.searchLabels(args))),
      labels_get: async ({ label_id: labelId }) =>
        textResponse(formatJson(await this.apiClient.get('labels', labelId))),
      labels_create: async (args = {}) =>
        textResponse(
          formatJson(await this.createWrapped('labels', 'label', this.buildLabelPayload(args)))
        ),
      labels_update: async ({ label_id: labelId, ...args }) =>
        textResponse(
          formatJson(await this.updateWrapped('labels', labelId, 'label', this.buildLabelPayload(args)))
        ),
      labels_delete: async ({ label_id: labelId }) =>
        textResponse(formatJson(await this.apiClient.delete('labels', labelId))),
      tags_list: async () => textResponse(formatJson(await this.listTags())),
      tags_get: async ({ tag_id: tagId }) =>
        textResponse(formatJson(await this.getTagByTitle(tagId))),
      tags_search: async (args = {}) =>
        textResponse(formatJson(await this.searchTags(args))),
      issues_list: async (args = {}) => textResponse(formatJson(await this.listIssues(args))),
      issues_search: async (args = {}) => textResponse(formatJson(await this.searchIssues(args))),
      issues_create: async (args = {}) => textResponse(formatJson(await this.createIssue(args))),
      issues_delete: async ({ issue_id: issueId, type }) =>
        textResponse(formatJson(await this.apiClient.delete('issues', issueId, { type }))),
      plans_list: async (args = {}) => textResponse(formatJson(await this.listPlans(args))),
      plans_search: async (args = {}) => textResponse(formatJson(await this.searchPlans(args))),
      plans_get: async ({ plan_id: planId }) =>
        textResponse(formatJson(await this.apiClient.get('plans', planId))),
      plans_create: async (args = {}) =>
        textResponse(formatJson(await this.createWrapped('plans', 'plan', this.buildPlanPayload(args)))),
      plans_update: async ({ plan_id: planId, ...args }) =>
        textResponse(
          formatJson(await this.updateWrapped('plans', planId, 'plan', this.buildPlanPayload(args)))
        ),
      plans_delete: async ({ plan_id: planId }) =>
        textResponse(formatJson(await this.apiClient.delete('plans', planId))),
      plans_issues_list: async ({ plan_id: planId, page, per_page: perPage, source }) =>
        textResponse(
          formatJson(
            await this.listIssuesForKey({
              resourceKey: 'plan_id',
              resourceId: planId,
              page,
              per_page: perPage,
              source,
            })
          )
        ),
      plans_issues_link: async ({ plan_id: planId, url, jira_id: jiraId }) =>
        textResponse(
          formatJson(
            await this.linkIssueForKey({
              resourceKey: 'plan_id',
              resourceId: planId,
              url,
              jira_id: jiraId,
            })
          )
        ),
      plans_issues_unlink: async ({ issue_id: issueId, type }) =>
        textResponse(formatJson(await this.apiClient.delete('issues', issueId, { type }))),
    };

    for (const tool of TOOL_DEFINITIONS) {
      if (tool.name === 'system_ping') {
        continue;
      }

      if (!handlers[tool.name]) {
        handlers[tool.name] = async () => textResponse(`${DEFAULT_TOOL_RESPONSE} (${tool.name})`);
      }
    }

    return handlers;
  }

  async execute(name, args = {}) {
    const handler = this.handlers[name];

    if (!handler) {
      throw new NotImplementedToolError(name);
    }

    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof ApiError) {
        return textResponse(
          formatJson({
            error: error.message,
            status: error.status,
            url: error.url,
            details: error.payload || null,
          })
        );
      }

      this.logger?.error('Unhandled tool execution error', { name, error: error?.message || error });
      return textResponse(formatJson({ error: error?.message || 'Unknown execution error' }));
    }
  }

  listTests({
    page,
    per_page: perPage,
    suite_id: suiteId,
    search_text: searchText,
    query,
    ...filters
  } = {}) {
    return this.apiClient.list('tests', {
      page,
      per_page: perPage,
      suite_id: suiteId,
      search_text: searchText || query,
      ...filters,
    });
  }

  searchTests({ query, search_text: searchText, ...rest } = {}) {
    return this.listTests({
      ...rest,
      search_text: searchText || query,
    });
  }

  listSuites({
    page,
    per_page: perPage,
    file_type: fileType,
    tag,
    labels,
    search_text: searchText,
    query,
  } = {}) {
    return this.apiClient.list('suites', {
      page,
      per_page: perPage,
      file_type: fileType,
      tag,
      labels,
      search_text: searchText || query,
    });
  }

  searchSuites({ query, search_text: searchText, ...rest } = {}) {
    return this.listSuites({
      ...rest,
      search_text: searchText || query,
    });
  }

  listRuns({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('runs', {
      page,
      per_page: perPage,
      query,
    });
  }

  searchRuns({ page, per_page: perPage, query } = {}) {
    return this.listRuns({
      page,
      per_page: perPage,
      query,
    });
  }

  listTestruns({ page, per_page: perPage, run_id: runId, query } = {}) {
    return this.apiClient.list('testruns', {
      page,
      per_page: perPage,
      run_id: runId,
      query,
    });
  }

  searchTestruns({ page, per_page: perPage, run_id: runId, query } = {}) {
    return this.listTestruns({
      page,
      per_page: perPage,
      run_id: runId,
      query,
    });
  }

  listRungroups({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('rungroups', {
      page,
      per_page: perPage,
      query,
    });
  }

  searchRungroups({ page, per_page: perPage, query } = {}) {
    return this.listRungroups({
      page,
      per_page: perPage,
      query,
    });
  }

  listSteps({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('steps', {
      page,
      per_page: perPage,
      query,
    });
  }

  searchSteps({ page, per_page: perPage, query } = {}) {
    return this.listSteps({
      page,
      per_page: perPage,
      query,
    });
  }

  listSnippets({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('snippets', {
      page,
      per_page: perPage,
      query,
    });
  }

  searchSnippets({ page, per_page: perPage, query } = {}) {
    return this.listSnippets({
      page,
      per_page: perPage,
      query,
    });
  }

  listLabels({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('labels', {
      page,
      per_page: perPage,
      query,
    });
  }

  searchLabels({ page, per_page: perPage, query } = {}) {
    return this.listLabels({
      page,
      per_page: perPage,
      query,
    });
  }

  listTags() {
    return this.apiClient.list('tags');
  }

  getTagByTitle(tagId) {
    return this.apiClient.get('tags', tagId);
  }

  searchTags({ tag_id: tagId, query } = {}) {
    const resolvedTag = tagId || query;
    if (!resolvedTag) {
      throw new Error('Provide "tag_id" or "query" for tags_search.');
    }

    return this.getTagByTitle(resolvedTag);
  }

  listIssues({ page, per_page: perPage, source, ...resourceQuery } = {}) {
    this.validateIssueResourceQuery(resourceQuery, { allowEmpty: true, allowMany: false });
    return this.listIssuesForResource({
      ...resourceQuery,
      page,
      per_page: perPage,
      source,
    });
  }

  searchIssues(args = {}) {
    return this.listIssues(args);
  }

  createIssue({ url, jira_id: jiraId, ...resourceQuery } = {}) {
    this.validateIssueResourceQuery(resourceQuery, { allowEmpty: false, allowMany: false });

    return this.linkIssueToResource({
      ...resourceQuery,
      url,
      jira_id: jiraId,
    });
  }

  async createWrapped(resource, wrapperKey, payload) {
    const wrappedBody = { [wrapperKey]: payload };

    try {
      return await this.apiClient.create(resource, payload);
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, wrapperKey)) {
        throw error;
      }
      return this.apiClient.create(resource, wrappedBody);
    }
  }

  async updateWrapped(resource, id, wrapperKey, payload) {
    const wrappedBody = { [wrapperKey]: payload };

    try {
      return await this.apiClient.update(resource, id, payload);
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, wrapperKey)) {
        throw error;
      }
      return this.apiClient.update(resource, id, wrappedBody);
    }
  }

  listPlans({ page, per_page: perPage, query } = {}) {
    return this.apiClient.list('plans', {
      page,
      per_page: perPage,
      query,
    });
  }

  searchPlans({ page, per_page: perPage, query } = {}) {
    return this.listPlans({
      page,
      per_page: perPage,
      query,
    });
  }

  listIssuesForResource({ page, per_page: perPage, source, ...resourceQuery } = {}) {
    return this.apiClient.list('issues', {
      ...resourceQuery,
      page,
      per_page: perPage,
      source,
    });
  }

  listIssuesForKey({ resourceKey, resourceId, page, per_page: perPage, source }) {
    this.assertSupportedIssueResourceKey(resourceKey);
    return this.listIssuesForResource({
      [resourceKey]: resourceId,
      page,
      per_page: perPage,
      source,
    });
  }

  linkIssueForKey({ resourceKey, resourceId, url, jira_id: jiraId }) {
    this.assertSupportedIssueResourceKey(resourceKey);
    return this.linkIssueToResource({
      [resourceKey]: resourceId,
      url,
      jira_id: jiraId,
    });
  }

  linkIssueToResource({ url, jira_id: jiraId, ...resourceQuery } = {}) {
    if (Boolean(url) === Boolean(jiraId)) {
      throw new Error('Provide exactly one field: "url" or "jira_id".');
    }
    this.validateIssueResourceQuery(resourceQuery, { allowEmpty: false, allowMany: false });

    const payload = {
      url,
      jira_id: jiraId,
    };

    return this.createIssueWithFallback(resourceQuery, payload);
  }

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
  }

  assertSupportedIssueResourceKey(resourceKey) {
    if (!ISSUE_RESOURCE_KEYS.includes(resourceKey)) {
      throw new Error(`Unsupported issue resource key: ${resourceKey}`);
    }
  }

  validateIssueResourceQuery(resourceQuery = {}, { allowEmpty = false, allowMany = false } = {}) {
    const provided = ISSUE_RESOURCE_KEYS.filter((key) => {
      const value = resourceQuery[key];
      return value !== undefined && value !== null && value !== '';
    });

    if (!allowEmpty && provided.length === 0) {
      throw new Error(
        `Provide one resource id: ${ISSUE_RESOURCE_KEYS.join(', ')}.`
      );
    }

    if (!allowMany && provided.length > 1) {
      throw new Error(
        `Provide only one resource id at a time: ${ISSUE_RESOURCE_KEYS.join(', ')}.`
      );
    }

    return provided;
  }

  buildTestPayload({
    title,
    suite_id: suiteId,
    description,
    emoji,
    priority,
    assigned_to: assignedTo,
    code,
    state,
    sync,
    link,
  } = {}) {
    return {
      title,
      suite_id: suiteId,
      description,
      emoji,
      priority,
      assigned_to: assignedTo,
      code,
      state,
      sync,
      link,
    };
  }

  buildSuitePayload({
    title,
    description,
    emoji,
    parent_id: parentId,
    file_type: fileType,
    assigned_to: assignedTo,
    file,
    children,
    link,
  } = {}) {
    return {
      title,
      description,
      emoji,
      parent_id: parentId,
      file_type: fileType,
      assigned_to: assignedTo,
      file,
      children,
      link,
    };
  }

  buildRunCreatePayload({
    title,
    description,
    plan_id: planId,
    kind,
    rungroup_id: rungroupId,
    env,
    assigned_to: assignedTo,
    assign_strategy: assignStrategy,
    test_ids: testIds,
    envs,
    configuration,
    link,
  } = {}) {
    return {
      title,
      description,
      plan_id: planId,
      kind,
      rungroup_id: rungroupId,
      env,
      assigned_to: assignedTo,
      assign_strategy: assignStrategy,
      test_ids: testIds,
      envs,
      configuration,
      link,
    };
  }

  buildRunUpdatePayload({
    title,
    description,
    plan_id: planId,
    kind,
    rungroup_id: rungroupId,
    env,
    status_event: statusEvent,
    assigned_to: assignedTo,
    assign_strategy: assignStrategy,
    test_ids: testIds,
    configuration,
    link,
  } = {}) {
    return {
      title,
      description,
      plan_id: planId,
      kind,
      rungroup_id: rungroupId,
      env,
      status_event: statusEvent,
      assigned_to: assignedTo,
      assign_strategy: assignStrategy,
      test_ids: testIds,
      configuration,
      link,
    };
  }

  async createRunWithFallback(args = {}) {
    const payload = this.buildRunCreatePayload(args);

    try {
      return await this.apiClient.create('runs', payload);
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, 'run')) {
        throw error;
      }

      return this.apiClient.create('runs', { run: payload });
    }
  }

  async updateRunWithFallback(runId, args = {}) {
    const payload = this.buildRunUpdatePayload(args);

    try {
      return await this.apiClient.update('runs', runId, payload);
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, 'run')) {
        throw error;
      }

      return this.apiClient.update('runs', runId, { run: payload });
    }
  }

  shouldRetryWrappedBody(error, wrapperKey) {
    if (!error || ![400, 422].includes(error.status)) {
      return false;
    }

    const payload = error.payload || {};
    const message = String(payload.message || payload.error || payload.raw || '').toLowerCase();
    return message.includes('param is missing') && message.includes(wrapperKey.toLowerCase());
  }

  buildTestrunPayload({
    run_id: runId,
    test_id: testId,
    status,
    message,
    run_time: runTime,
    assigned_to: assignedTo,
    test_title: testTitle,
    automated,
  } = {}) {
    return {
      run_id: runId,
      test_id: testId,
      status,
      message,
      run_time: runTime,
      assigned_to: assignedTo,
      test_title: testTitle,
      automated,
    };
  }

  buildRungroupPayload({
    title,
    description,
    emoji,
    kind,
    pin,
    status,
    parent_id: parentId,
    children,
  } = {}) {
    return {
      title,
      description,
      emoji,
      kind,
      pin,
      status,
      parent_id: parentId,
      children,
    };
  }

  buildStepPayload({ title, description, link } = {}) {
    return {
      title,
      description,
      link,
    };
  }

  buildSnippetPayload({ title, description, link } = {}) {
    return {
      title,
      description,
      link,
    };
  }

  buildLabelPayload({ title, color, visibility, scope, field } = {}) {
    return {
      title,
      color,
      visibility,
      scope,
      field,
    };
  }

  buildPlanPayload({
    title,
    description,
    kind,
    hidden,
    as_manual: asManual,
    test_plan: testPlan,
    link,
  } = {}) {
    return {
      title,
      description,
      kind,
      hidden,
      as_manual: asManual,
      test_plan: testPlan,
      link,
    };
  }
}
