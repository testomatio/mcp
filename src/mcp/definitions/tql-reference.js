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
];

const TESTS_TQL_EXAMPLES = [
  "priority == 'high'",
  "state == 'automated'",
  "tag in ['smoke', 'stage1'] and status == 'failed'",
  "suite % 'Checkout'",
  "test % 'User login'",
  "created_at < 1.month_ago",
  "jira in ['JST-1', 'JST-2']",
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
  "Supported syntax includes `==`, `!=`, `>`, `<`, `>=`, `<=`, `in [...]`, `%` for partial text match, `and`, `or`, `not`, and parentheses for grouping. Use quotes for string values, for example `state == 'automated'`.";

export const TESTS_TQL_REFERENCE =
  `TQL (Testomat.io Query Language) is a string expression passed in \`tql\` to filter tests. ${COMMON_TQL_SYNTAX} ` +
  `Documented test variables: ${TESTS_TQL_VARIABLES.map((item) => `\`${item}\``).join(', ')}. ` +
  `Documented examples: ${TESTS_TQL_EXAMPLES.map((item) => `\`${item}\``).join(', ')}. ` +
  'Do not invent undocumented fields or syntax. If a query fails, simplify it to one documented predicate.';

export const TESTS_TQL_INPUT_DESCRIPTION =
  `TQL filter for tests. Documented variables: ${TESTS_TQL_VARIABLES.map((item) => `\`${item}\``).join(', ')}. ` +
  `Examples: ${TESTS_TQL_EXAMPLES.map((item) => `\`${item}\``).join(', ')}.`;

export const RUNS_TQL_REFERENCE =
  `TQL (Testomat.io Query Language) is a string expression passed in \`tql\` to filter runs. ${COMMON_TQL_SYNTAX} ` +
  'Runs also support boolean flags without comparison such as `failed`, `finished`, `automated`, or `with_defect`. ' +
  `Documented run variables: ${RUNS_TQL_VARIABLES.map((item) => `\`${item}\``).join(', ')}. ` +
  `Documented examples: ${RUNS_TQL_EXAMPLES.map((item) => `\`${item}\``).join(', ')}. ` +
  'Do not invent undocumented fields or syntax. If a query fails, simplify it to one documented predicate.';

export const RUNS_TQL_INPUT_DESCRIPTION =
  `TQL filter for runs. Documented variables: ${RUNS_TQL_VARIABLES.map((item) => `\`${item}\``).join(', ')}. ` +
  `Examples: ${RUNS_TQL_EXAMPLES.map((item) => `\`${item}\``).join(', ')}.`;
