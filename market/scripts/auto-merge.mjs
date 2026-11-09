// Auto-merge needs repository settings, not only passing checks. The repository
// must allow auto-merge. The base branch must use strict branch protection and
// require the market/catalog status. A submission can pass every npm check and
// still be unmergeable when these settings are missing. Return the gaps so the
// workflow can warn and keep the PR open for manual merge.
const CONTEXT = 'market/catalog';

export function autoMergeSetup(repository, pullRequest) {
  const rule = pullRequest?.baseRef?.branchProtectionRule;
  const contexts = Array.isArray(rule?.requiredStatusCheckContexts)
    ? rule.requiredStatusCheckContexts
    : [];
  const missing = [];
  if (repository?.autoMergeAllowed !== true) missing.push('Allow auto-merge for the repository');
  if (rule?.requiresStatusChecks !== true) missing.push('Require status checks before merging');
  if (rule?.requiresStrictStatusChecks !== true) missing.push('Require branches to be up to date before merging');
  if (!contexts.includes(CONTEXT)) missing.push(`Require the ${CONTEXT} status check`);
  return { ready: missing.length === 0, missing };
}
