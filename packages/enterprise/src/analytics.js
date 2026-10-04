import {
  ANALYTICS_STATS_TQL_INPUT_DESCRIPTION,
  ANALYTICS_STATS_TQL_REFERENCE,
  ANALYTICS_TESTS_TQL_INPUT_DESCRIPTION,
  ANALYTICS_TESTS_TQL_REFERENCE,
  TOOL_DEFINITIONS,
  backendSlimQuery,
  slimList,
  withListOptions,
} from './load-core.js';

const ANALYTICS_TEST_KINDS = [
  'flaky',
  'slow',
  'failing',
  'evergreen',
  'never-executed',
  'skipped',
  'failures',
  'defects',
  'issues',
];

const ANALYTICS_STATS_KINDS = [
  'project-summary',
  'runs-summary',
  'success-rate-by-date',
  'automation-rate-by-date',
  'automation-by-date',
  'testruns-by-date',
  'priority-by-date',
  'failed-runs-by-priority',
  'latest-failed-runs-by-priority',
  'run-results-by-priority-status',
  'latest-run-results-by-priority-status',
  'milestone-completion',
  'milestone-tests',
  'milestone-runs',
  'milestone-plans',
  'milestone-requirements',
  'milestone-users',
];

const commonAnalyticsProperties = {
  days: {
    type: 'integer',
    minimum: 1,
    description: 'Lookback window in days. Ignored when from/to are provided.',
  },
  from: {
    type: 'string',
    description: 'Inclusive start date in YYYY-MM-DD format. Takes precedence over days.',
  },
  to: {
    type: 'string',
    description: 'Inclusive end date in YYYY-MM-DD format.',
  },
  envs: {
    type: 'string',
    description:
      'Comma-separated execution environments, for example: staging,production. Values must exactly match (case-sensitive) the project environments returned by `project_info`; an unknown value returns 422 with the valid list in `known_environments`.',
  },
};

export const ANALYTICS_TOOLS = withListOptions([
  {
    name: 'analytics_tests',
    description:
      `Enterprise analytics: list tests matching an analytics report (/api/v2/{project_id}/analytics/tests/{kind}). Requires api_analytics subscription feature. For kind=flaky, each row has \`pass_rate\` (0-1, share of passed executions; same scale as min/max) and \`flakiness\` (0-1, 1.0 = even pass/fail split, 0 = always passing or always failing); \`flaky_rate\` is deprecated (raw 2-3 scale), ignore it. ${ANALYTICS_TESTS_TQL_REFERENCE}`,
    inputSchema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ANALYTICS_TEST_KINDS,
          description: 'Test-level analytics report kind.',
        },
        q: {
          type: 'string',
          description: ANALYTICS_TESTS_TQL_INPUT_DESCRIPTION,
        },
        ...commonAnalyticsProperties,
        page: {
          type: 'integer',
          minimum: 1,
        },
        per_page: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
        min: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Pass rate lower bound (0-1, default 0.1). Applies only to kind=flaky.',
        },
        max: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Pass rate upper bound (0-1, default 0.9). Applies only to kind=flaky.',
        },
        order_by: {
          type: 'string',
          enum: ['flakiness', 'pass_rate'],
          description:
            'Sort order for kind=flaky. `flakiness` (default) ranks tests closest to a 50/50 pass/fail split first; `pass_rate` ranks lowest pass rate first (mostly broken tests on top). Applies only to kind=flaky.',
        },
        threshold_ms: {
          type: 'integer',
          minimum: 11,
          description: 'Duration threshold in milliseconds. Applies only to kind=slow.',
        },
        maturity_days: {
          type: 'integer',
          minimum: 0,
          description: 'Minimum test age in days. Applies only to kind=never-executed.',
        },
        run: {
          type: 'string',
          description: 'Scope results to one run UID. Applies only to kind=flaky or kind=slow.',
        },
        group_by: {
          type: 'string',
          enum: ['suite', 'priority', 'tag', 'label', 'env', 'test'],
          description:
            'Return aggregate counts instead of a test list: rows of {key, label, test_count} sorted by test_count descending, not paginated. `key` is the suite UID for suite (label = suite title); the value itself for priority/tag/label/env. Supported only for kind=failing, skipped, flaky, slow, never-executed (`env` not supported for never-executed); other combinations return 422. `test` is supported only for kind=slow: rows of {key (test UID), label (title), executions, avg_run_time, max_run_time, p95_run_time, total_run_time} sorted by total_run_time descending (biggest CI-time consumers first), aggregated over every execution in the period that meets threshold_ms.',
        },
      },
      required: ['kind'],
      additionalProperties: false,
    },
  },
  {
    name: 'analytics_stats',
    description:
      `Enterprise analytics: fetch an aggregated analytics report (/api/v2/{project_id}/analytics/stats/{kind}). Requires api_analytics subscription feature. ${ANALYTICS_STATS_TQL_REFERENCE}`,
    inputSchema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ANALYTICS_STATS_KINDS,
          description:
            'Aggregated analytics report kind. Trend series (one row per day): success-rate-by-date, automation-rate-by-date, automation-by-date, testruns-by-date, priority-by-date. Priority breakdowns: failed-runs-by-priority, run-results-by-priority-status, and their latest-* variants (most recent run only). Summaries: project-summary, runs-summary. Sprint/release reporting: milestone-completion, milestone-tests, milestone-runs, milestone-plans, milestone-requirements, milestone-users (require `milestone`).',
        },
        q: {
          type: 'string',
          description: ANALYTICS_STATS_TQL_INPUT_DESCRIPTION,
        },
        ...commonAnalyticsProperties,
        page: {
          type: 'integer',
          minimum: 1,
          description:
            'Page number. Applies only to runs-summary and milestone-runs, which are always paginated (defaults page=1, per_page=30) — check meta.total/meta.total_pages to fetch the rest. Ignored by other kinds.',
        },
        per_page: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'Rows per page (default 30). Applies only to runs-summary and milestone-runs.',
        },
        milestone: {
          type: 'string',
          description:
            'Milestone slug (the `id` returned by the `milestones` tool, `list` command). Required for milestone-* kinds: without it they return an empty result, not an error. An unknown slug returns 422. Ignored by other kinds.',
        },
      },
      required: ['kind'],
      additionalProperties: false,
    },
  },
  {
    name: 'analytics_charts_list',
    description:
      'Enterprise analytics: list saved analytics charts and queries (/api/v2/{project_id}/analytics/charts). Each item bundles one or more TQL queries under a single title, optionally rendered as a chart. Requires api_analytics subscription feature.',
    inputSchema: {
      type: 'object',
      properties: {
        has_chart: {
          type: 'boolean',
          description: 'When true, only items with a chart type set; when false, only plain saved queries with no chart.',
        },
        kind: {
          type: 'string',
          enum: ['tests', 'runs'],
          description: 'Filter by context: charts over tests or over runs.',
        },
        my_charts: {
          type: 'boolean',
          description: 'When true, only items created by the authenticated user.',
        },
        only_widgets: {
          type: 'boolean',
          description: 'When true, only items marked as dashboard widgets.',
        },
        page: {
          type: 'integer',
          minimum: 1,
        },
        per_page: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'analytics_charts_get',
    description:
      'Enterprise analytics: get a saved chart or query definition — title, chart type, context, and the ordered TQL queries that make it up (/api/v2/{project_id}/analytics/charts/{id}). Requires api_analytics subscription feature.',
    inputSchema: {
      type: 'object',
      properties: {
        chart_id: {
          type: 'string',
          description: 'Chart public UID.',
        },
      },
      required: ['chart_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'analytics_charts_results',
    description:
      'Enterprise analytics: current results of a saved chart (/api/v2/{project_id}/analytics/charts/{id}/result). Without `number`, returns the match count for every query in the chart; with `number` (zero-based query index), returns the matching tests or runs for that query, paginated. Requires api_analytics subscription feature.',
    inputSchema: {
      type: 'object',
      properties: {
        chart_id: {
          type: 'string',
          description: 'Chart public UID.',
        },
        number: {
          type: 'integer',
          minimum: 0,
          description: 'Zero-based index of the query within the chart to fetch full results for. Omit to get totals for all queries instead.',
        },
        page: {
          type: 'integer',
          minimum: 1,
        },
        per_page: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['chart_id'],
      additionalProperties: false,
    },
  },
], { extraNames: ['analytics_tests', 'analytics_charts_results'] });

export const ENTERPRISE_TOOL_DEFINITIONS = [
  ...TOOL_DEFINITIONS,
  ...ANALYTICS_TOOLS,
];

export function registerAnalyticsHandlers(handlers) {
  handlers.analytics_tests = async (args = {}) =>
    this.asText(
      slimList(await analyticsTests.call(this, { ...args, ...backendSlimQuery(args) }), {
        verbose: args.verbose,
        fields: args.fields,
        entity: 'analytics_tests',
      })
    );
  handlers.analytics_stats = async (args = {}) => this.asText(await analyticsStats.call(this, args));

  handlers.analytics_charts_list = async (args = {}) => {
    const { verbose, fields, ...listArgs } = args;
    return this.asText(
      slimList(await analyticsChartsList.call(this, listArgs), {
        verbose,
        fields,
        entity: 'analytics_charts',
      })
    );
  };

  handlers.analytics_charts_get = async (args = {}) => {
    const id = this.pickRequiredArg(args, 'chart_id');
    return this.asText(await this.apiClient.get('analytics/charts', id));
  };

  handlers.analytics_charts_results = async (args = {}) => {
    const { verbose, fields, ...restArgs } = args;
    const payload = await analyticsChartResults.call(this, restArgs);
    return this.asText(
      slimList(payload, {
        verbose,
        fields,
        entity: 'analytics_chart_results',
      })
    );
  };
}

function analyticsTests({
  kind,
  q,
  days,
  from,
  to,
  envs,
  page,
  per_page: perPage,
  min,
  max,
  order_by: orderBy,
  threshold_ms: thresholdMs,
  maturity_days: maturityDays,
  run,
  group_by: groupBy,
  slim,
} = {}) {
  return this.apiClient.list(`analytics/tests/${this.pickRequiredArg({ kind }, 'kind')}`, {
    q,
    days,
    from,
    to,
    envs,
    page,
    per_page: perPage,
    min,
    max,
    order_by: orderBy,
    threshold_ms: thresholdMs,
    maturity_days: maturityDays,
    run,
    group_by: groupBy,
    slim,
  });
}

function analyticsStats({ kind, q, days, from, to, envs, milestone, page, per_page: perPage } = {}) {
  return this.apiClient.list(`analytics/stats/${this.pickRequiredArg({ kind }, 'kind')}`, {
    q,
    days,
    from,
    to,
    milestone,
    envs,
    page,
    per_page: perPage,
  });
}

function analyticsChartsList({ has_chart, kind, my_charts, only_widgets, page, per_page: perPage } = {}) {
  return this.apiClient.list('analytics/charts', {
    has_chart,
    kind,
    my_charts,
    only_widgets,
    page,
    per_page: perPage,
  });
}

function analyticsChartResults({ chart_id, number, page, per_page: perPage } = {}) {
  const id = this.pickRequiredArg({ chart_id }, 'chart_id');
  return this.apiClient.list(`analytics/charts/${id}/result`, {
    number,
    page,
    per_page: perPage,
  });
}
