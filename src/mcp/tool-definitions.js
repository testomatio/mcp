import { SYSTEM_TOOLS } from './definitions/system.js';
import { PROJECT_TOOLS } from './definitions/projects.js';
import { TESTS_TOOL, TESTS_TOOL_SPEC } from './definitions/tests.js';
import { SUITES_TOOL, SUITES_TOOL_SPEC } from './definitions/suites.js';
import { RUNS_TOOL, RUNS_TOOL_SPEC } from './definitions/runs.js';
import { TESTRUNS_TOOL, TESTRUNS_TOOL_SPEC } from './definitions/testruns.js';
import { RUNGROUPS_TOOL, RUNGROUPS_TOOL_SPEC } from './definitions/rungroups.js';
import { STEPS_TOOL, STEPS_TOOL_SPEC } from './definitions/steps.js';
import { SNIPPETS_TOOL, SNIPPETS_TOOL_SPEC } from './definitions/snippets.js';
import { LABELS_TOOL, LABELS_TOOL_SPEC } from './definitions/labels.js';
import { TAGS_TOOL, TAGS_TOOL_SPEC } from './definitions/tags.js';
import { MILESTONES_TOOL, MILESTONES_TOOL_SPEC } from './definitions/milestones.js';
import { ISSUES_TOOL, ISSUES_TOOL_SPEC } from './definitions/issues.js';
import { PLANS_TOOL, PLANS_TOOL_SPEC } from './definitions/plans.js';
import { REQUIREMENTS_TOOL, REQUIREMENTS_TOOL_SPEC } from './definitions/requirements.js';
import { BRANCHES_TOOL, BRANCHES_TOOL_SPEC } from './definitions/branches.js';

export const TOOL_DEFINITIONS = [
  ...SYSTEM_TOOLS,
  ...PROJECT_TOOLS,
  TESTS_TOOL,
  SUITES_TOOL,
  RUNS_TOOL,
  TESTRUNS_TOOL,
  RUNGROUPS_TOOL,
  STEPS_TOOL,
  SNIPPETS_TOOL,
  LABELS_TOOL,
  TAGS_TOOL,
  MILESTONES_TOOL,
  ISSUES_TOOL,
  PLANS_TOOL,
  REQUIREMENTS_TOOL,
  BRANCHES_TOOL,
];

// Specs behind the entity tools; tool-profiles rebuilds profiled tools from them.
export const ENTITY_TOOL_SPECS = [
  TESTS_TOOL_SPEC,
  SUITES_TOOL_SPEC,
  RUNS_TOOL_SPEC,
  TESTRUNS_TOOL_SPEC,
  RUNGROUPS_TOOL_SPEC,
  STEPS_TOOL_SPEC,
  SNIPPETS_TOOL_SPEC,
  LABELS_TOOL_SPEC,
  TAGS_TOOL_SPEC,
  MILESTONES_TOOL_SPEC,
  ISSUES_TOOL_SPEC,
  PLANS_TOOL_SPEC,
  REQUIREMENTS_TOOL_SPEC,
  BRANCHES_TOOL_SPEC,
];
