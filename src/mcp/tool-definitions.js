import { SYSTEM_TOOLS } from './definitions/system.js';
import { TESTS_TOOLS } from './definitions/tests.js';
import { SUITES_TOOLS } from './definitions/suites.js';
import { RUNS_TOOLS } from './definitions/runs.js';
import { TESTRUNS_TOOLS } from './definitions/testruns.js';
import { RUNGROUPS_TOOLS } from './definitions/rungroups.js';
import { STEPS_TOOLS } from './definitions/steps.js';
import { SNIPPETS_TOOLS } from './definitions/snippets.js';
import { LABELS_TOOLS } from './definitions/labels.js';
import { TAGS_TOOLS } from './definitions/tags.js';
import { ISSUES_TOOLS } from './definitions/issues.js';
import { PLANS_TOOLS } from './definitions/plans.js';

export const TOOL_DEFINITIONS = [
  ...SYSTEM_TOOLS,
  ...TESTS_TOOLS,
  ...SUITES_TOOLS,
  ...RUNS_TOOLS,
  ...TESTRUNS_TOOLS,
  ...RUNGROUPS_TOOLS,
  ...STEPS_TOOLS,
  ...SNIPPETS_TOOLS,
  ...LABELS_TOOLS,
  ...TAGS_TOOLS,
  ...ISSUES_TOOLS,
  ...PLANS_TOOLS,
];
