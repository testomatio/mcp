const TESTS_TQL_VARIABLES = [
  'tag',
  'label',
  'priority',
  'issue',
  'jira',
  'state',
  'status',
  'custom_status',
  'created_at',
  'updated_at',
  'last_run_at',
  'executed_at',
  'created_by',
  'assigned_to',
  'suite',
  'test',
  'shared',
  'milestone',
];

const RUNS_TQL_VARIABLES = [
  'title',
  'plan',
  'rungroup',
  'env',
  'tag',
  'label',
  'jira',
  'duration',
  'passed_count',
  'failed_count',
  'skipped_count',
  'automated',
  'manual',
  'mixed',
  'finished',
  'unfinished',
  'passed',
  'failed',
  'terminated',
  'published',
  'private',
  'archived',
  'unarchived',
  'with_defect',
  'has_defect',
  'has_test',
  'has_test_tag',
  'has_test_label',
  'has_suite',
  'has_message',
  'has_custom_status',
  'has_assigned_to',
  'has_retries',
  'has_test_duration',
  'has_priority',
  'created_at',
  'updated_at',
  'launched_at',
  'finished_at',
  'milestone',
];

const TESTS_TQL_EXAMPLES = [
  "priority == 'high'",
  "priority >= 'normal'",
  "state == 'automated'",
  "tag in ['smoke', 'stage1'] and status == 'failed'",
  "suite % 'Checkout'",
  "test % 'User login'",
  "custom_status % 'issue'",
  "created_at < 1.month_ago",
  "jira in ['JST-1', 'JST-2']",
  "milestone == 'Sprint 1'",
];

const RUNS_TQL_EXAMPLES = [
  "title % 'Manual tests'",
  "plan == '{PLAN_ID}'",
  "env in ['Windows', 'Linux']",
  "failed and has_test_tag == 'regression'",
  'finished and with_defect',
  'has_retries > 2',
  "automated and env == 'Production' and has_message % 'Server Error'",
  "finished_at >= '2025-07-01' and finished_at <= '2025-07-31' and failed",
];

const COMMON_TQL_SYNTAX =
  "Supported syntax includes logical operators `and`, `or`, `not`, equality operators `==` and `!=`, list membership `in [...]`, `%` for partial text match on supported text fields, and parentheses for grouping. Ordered comparisons `>`, `<`, `>=`, `<=` are for ordered fields such as `priority`, dates, and numeric counters/durations. Use quotes for string values, for example `state == 'automated'`.";

const TESTS_TQL_FIELDS = TESTS_TQL_VARIABLES.join(', ');
const RUNS_TQL_FIELDS = RUNS_TQL_VARIABLES.join(', ');

export const TQL_FULL_REFERENCE = [
  'TQL (Testomat.io Query Language) is a string expression used to filter tests and runs.',
  COMMON_TQL_SYNTAX,
  '',
  `Tests filter variables: ${TESTS_TQL_VARIABLES.map((v) => `\`${v}\``).join(', ')}.`,
  `Tests examples: ${TESTS_TQL_EXAMPLES.map((e) => `\`${e}\``).join(', ')}.`,
  '',
  `Runs filter variables: ${RUNS_TQL_VARIABLES.map((v) => `\`${v}\``).join(', ')}.`,
  'Runs also support boolean flags used without comparison, e.g. `failed`, `finished`, `automated`, `with_defect`.',
  `Runs examples: ${RUNS_TQL_EXAMPLES.map((e) => `\`${e}\``).join(', ')}.`,
  '',
  'Parameter name: tests/runs/plans use `tql`; analytics tools use `q`.',
  'Do not invent undocumented fields or syntax. If a query fails, simplify it to one documented predicate.',
].join('\n');

export const TESTS_TQL_REFERENCE =
  'Filter tests with `tql` (TQL); call `tql_help` for the syntax and full field list.';
export const RUNS_TQL_REFERENCE =
  'Filter runs with `tql` (TQL); runs also accept boolean flags. Call `tql_help` for the syntax and full field list.';
export const PLANS_TQL_REFERENCE =
  'Select tests for the plan with `tql` (TQL); the API resolves matching tests. Call `tql_help` for the syntax and full field list.';
export const ANALYTICS_TESTS_TQL_REFERENCE =
  'Filter analytics test reports with `q` (TQL). Call `tql_help` for the syntax and full field list.';
export const ANALYTICS_STATS_TQL_REFERENCE =
  'Filter analytics aggregated reports with `q` (TQL; tests or runs variables). Call `tql_help` for the syntax and full field list.';

export const TESTS_TQL_INPUT_DESCRIPTION =
  `TQL filter for tests. Fields: ${TESTS_TQL_FIELDS}. Call \`tql_help\` for syntax. Examples: \`priority == 'high'\`, \`state == 'automated'\`, \`suite % 'Checkout'\`.`;
export const RUNS_TQL_INPUT_DESCRIPTION =
  `TQL filter for runs. Fields: ${RUNS_TQL_FIELDS}. Call \`tql_help\` for syntax. Examples: \`finished and with_defect\`, \`env in ['Windows', 'Linux']\`, \`has_retries > 2\`.`;
export const PLANS_TQL_INPUT_DESCRIPTION =
  `TQL to select tests for the plan. Fields: ${TESTS_TQL_FIELDS}. Call \`tql_help\` for syntax. Examples: \`priority == 'high'\`, \`tag in ['smoke', 'stage1']\`.`;
export const ANALYTICS_TESTS_TQL_INPUT_DESCRIPTION =
  `TQL filter (param \`q\`) for analytics test reports. Fields: ${TESTS_TQL_FIELDS}. Call \`tql_help\` for syntax. Examples: \`priority == 'high'\`, \`state == 'automated'\`.`;
export const ANALYTICS_STATS_TQL_INPUT_DESCRIPTION =
  `TQL filter (param \`q\`) for analytics reports. Test fields: ${TESTS_TQL_FIELDS}. Run fields: ${RUNS_TQL_FIELDS}. Call \`tql_help\` for syntax. Examples: \`priority == 'high'\`, \`finished_at >= '2025-07-01' and failed\`.`;
