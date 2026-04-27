import { TOOL_DEFINITIONS } from './load-core.js';

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
  q: {
    type: 'string',
    description:
      "TQL filter for analytics data. API parameter name is `q`, for example: priority == 'high' AND tag IN ['@smoke'].",
  },
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

export const ANALYTICS_TOOLS = [
  {
    name: 'analytics_tests',
    description:
      'Enterprise analytics: list tests matching an analytics report (/api/v2/{project_id}/analytics/tests/{kind}). Requires api_analytics subscription feature. Use `q` as the TQL filter.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ANALYTICS_TEST_KINDS,
          description: 'Test-level analytics report kind.',
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
      'Enterprise analytics: fetch an aggregated analytics report (/api/v2/{project_id}/analytics/stats/{kind}). Requires api_analytics subscription feature. Use `q` as the TQL filter.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ANALYTICS_STATS_KINDS,
          description: 'Aggregated analytics report kind.',
        },
        ...commonAnalyticsProperties,
      },
      required: ['kind'],
      additionalProperties: false,
    },
  },
];

export const ENTERPRISE_TOOL_DEFINITIONS = [
  ...TOOL_DEFINITIONS,
  ...ANALYTICS_TOOLS,
];

export function registerAnalyticsHandlers(handlers) {
  handlers.analytics_tests = async (args = {}) => this.asText(await analyticsTests.call(this, args));
  handlers.analytics_stats = async (args = {}) => this.asText(await analyticsStats.call(this, args));
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
