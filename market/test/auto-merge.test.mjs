import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { autoMergeSetup } from '../scripts/auto-merge.mjs';

const workflow = await readFile(new URL('../.github/workflows/check.yml', import.meta.url), 'utf8');

function check({ autoMergeAllowed = true, rule = {} } = {}) {
  const branchProtectionRule = {
    requiresStatusChecks: true,
    requiresStrictStatusChecks: true,
    requiredStatusCheckContexts: ['market/catalog'],
    ...rule,
  };
  const repository = {
    autoMergeAllowed,
    pullRequest: { baseRef: { branchProtectionRule } },
  };
  return autoMergeSetup(repository, repository.pullRequest);
}

test('a configured repository is ready for auto-merge', () => {
  assert.deepEqual(check(), { ready: true, missing: [] });
});

test('each missing repository setting is reported', () => {
  assert.deepEqual(check({ autoMergeAllowed: false }).missing, ['Allow auto-merge for the repository']);
  assert.deepEqual(check({ rule: { requiresStatusChecks: false } }).missing, [
    'Require status checks before merging',
  ]);
  assert.deepEqual(check({ rule: { requiresStrictStatusChecks: false } }).missing, [
    'Require branches to be up to date before merging',
  ]);
  assert.deepEqual(check({ rule: { requiredStatusCheckContexts: ['other'] } }).missing, [
    'Require the market/catalog status check',
  ]);
});

test('an absent rule or missing context list is reported without a TypeError', () => {
  assert.deepEqual(check({ rule: { requiredStatusCheckContexts: undefined } }).missing, [
    'Require the market/catalog status check',
  ]);
  const repository = { autoMergeAllowed: true, pullRequest: { baseRef: { branchProtectionRule: null } } };
  assert.deepEqual(autoMergeSetup(repository, repository.pullRequest), {
    ready: false,
    missing: [
      'Require status checks before merging',
      'Require branches to be up to date before merging',
      'Require the market/catalog status check',
    ],
  });
});

test('the workflow warns and skips instead of failing when settings are missing', () => {
  assert.match(workflow, /const \{autoMergeSetup\}=await import\(process\.cwd\(\)\+'\/scripts\/auto-merge\.mjs'\)/);
  assert.match(workflow, /if\(!setup\.ready\)/);
  assert.match(workflow, /core\.warning/);
  assert.doesNotMatch(workflow, /Configure auto-merge and strict branch protection requiring market\/catalog first/);
});
