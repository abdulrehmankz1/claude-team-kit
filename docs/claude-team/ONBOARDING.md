# Install or update the team

1. Extract this ZIP into a separate folder first. It includes .claude, CLAUDE.md, specs/_template, scripts/claude-team, evals/claude-team and docs/claude-team. Show hidden files so .claude is visible.
2. In the target project, preserve unrelated local changes/settings. Replace the 12 original agent definitions with the upgraded files and add the 5 new ones. Copy the shared references/hook/helpers. Merge settings and spec templates when the target has unrelated entries; do not overwrite an entire existing .claude directory blindly.
3. Merge the three @imports from supplied CLAUDE.md into your existing root CLAUDE.md. If none exists, use the supplied bootstrap. Specialist role context remains distinct from the main PM role.
4. Fill .claude/team/PROJECT-PROFILE.md and STATE.md for the new project (they start as blank templates) and record its own access preferences.
5. Inspect both settings.json and settings.local.json. The old local file allowed the entire shell; the replacement preserves acceptEdits but delegates grants to the scoped shared config. Merge unrelated existing permissions/hooks carefully; an existing broad local grant can still undermine the new policy.
6. SessionStart uses Node exec-form arguments and CLAUDE_PROJECT_DIR, avoiding a Bash-only cat command. Requires Node and a Claude version supporting this documented hook form. If an older runtime rejects it, omit this hook and have PM read STATE.md manually; do not invent compatibility flags. Verify current official docs for your version.
7. Restart Claude Code after installing these definitions, then ask it to invoke a named agent on a bounded read-only task. Verify the active definition; user/plugin overrides can take precedence. This package was statically validated, not live-loaded in Claude here.

## Local validation
Use Python 3 and a local virtual environment with scripts/claude-team/requirements.txt (PyYAML 6.0.2) if PyYAML is not already installed. From project root:

```bash
python3 scripts/claude-team/validate.py
python3 -m unittest discover -s scripts/claude-team -p 'validate_test.py'
node --test scripts/claude-team/*.test.mjs
```

On Windows use python instead of python3 if that is your interpreter name. These helpers do not install packages, send network requests or launch agents. The validator checks the kit's documented configuration subset, not full runtime semantics or managed-policy precedence.

## Resume prompt
“Use the upgraded 17-agent team. Reconcile the project profile/state against this checkout, inspect available runtime tools and existing work, then continue the brief from the evidenced next task. Preserve the profile's design-access, package-manager and no-push preferences. Do not claim unavailable verification ran.”

The original scripts/figma.mjs and scripts/token-report.mjs were not included in the uploaded archive; restore/verify them from the actual project if they exist. This update does not invent their behavior or exact token totals.
