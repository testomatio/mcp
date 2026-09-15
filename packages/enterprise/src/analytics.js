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
  'testruns-by-date',
  'priority-by-date',
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
    description: 'Comma-separated execution environments, for example: staging,production.',
  },
};

export const ANALYTICS_TOOLS = withListOptions([
  {
    name: 'analytics_tests',
    description:
      `Enterprise analytics: list tests matching an analytics report (/api/v2/{project_id}/analytics/tests/{kind}). Requires api_analytics subscription feature. ${ANALYTICS_TESTS_TQL_REFERENCE}`,
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
          description: 'Flaky rate lower bound. Applies only to kind=flaky.',
        },
        max: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Flaky rate upper bound. Applies only to kind=flaky.',
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
          description: 'Aggregated analytics report kind.',
        },
        q: {
          type: 'string',
          description: ANALYTICS_STATS_TQL_INPUT_DESCRIPTION,
        },
        ...commonAnalyticsProperties,
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
  threshold_ms: thresholdMs,
  maturity_days: maturityDays,
  run,
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
    threshold_ms: thresholdMs,
    maturity_days: maturityDays,
    run,
    slim,
  });
}

function analyticsStats({ kind, q, days, from, to, envs } = {}) {
  return this.apiClient.list(`analytics/stats/${this.pickRequiredArg({ kind }, 'kind')}`, {
    q,
    days,
    from,
    to,
    envs,
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
