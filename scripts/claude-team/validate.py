#!/usr/bin/env python3
"""Static validation of this kit's documented subset; does not launch Claude."""
import argparse
import json
import re
import sys
from pathlib import Path
try:
    import yaml
except ImportError:
    print('PyYAML is required: install the pinned scripts/claude-team/requirements.txt in a local venv.', file=sys.stderr)
    sys.exit(2)

EXPECTED = set('backend-dev code-reviewer creative-director cyber-security figma-analyst frontend-dev-2 frontend-dev motion-dev qa-tester qa-visual security-reviewer senior-dev system-design-architect prompt-engineer accessibility-specialist performance-engineer release-engineer'.split())
DESIGN = set('design-director ux-researcher information-architect ux-writer design-system-designer mobile-designer localisation-designer data-viz-designer design-handoff-specialist product-designer ui-designer motion-designer edge-case-specialist qa-usability-lead design-system-auditor accessibility-localisation-auditor product-logic-compliance-auditor'.split())
EXPECTED |= DESIGN
DESIGN_FIELDS = {'mcpServers','effort','memory','color','maxTurns'}
READ_ONLY = {'senior-dev', 'code-reviewer', 'security-reviewer'}
INHERITED_TESTERS = {'qa-visual', 'accessibility-specialist', 'performance-engineer'}
TOOLS = set('Read Write Edit Glob Grep Bash Skill WebSearch WebFetch ToolSearch NotebookEdit Agent TodoWrite'.split())
OPTIONAL = {'scripts/figma.mjs', 'scripts/token-report.mjs'}

class UniqueLoader(yaml.SafeLoader):
    pass

def unique_map(loader, node, deep=False):
    result = {}
    for key, value in node.value:
        k = loader.construct_object(key, deep=deep)
        if k in result:
            raise ValueError(f'duplicate YAML key: {k}')
        result[k] = loader.construct_object(value, deep=deep)
    return result
UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_map)

def unique_json(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f'duplicate JSON key: {key}')
        result[key] = value
    return result

def split_tools(value):
    if not isinstance(value, str):
        raise ValueError('tool fields must be comma-separated strings in this kit')
    # Split on commas outside parentheses so Agent(a, b) stays one entry.
    return {p.strip() for p in re.split(r',(?![^()]*\))', value) if p.strip()}

def validate(root):
    errors = []
    def require(condition, message):
        if not condition:
            errors.append(message)
    agents = root / '.claude/agents'
    actual = {p.stem for p in agents.glob('*.md')}
    require(actual == EXPECTED, f'agent set differs: missing={sorted(EXPECTED-actual)}, extra={sorted(actual-EXPECTED)}')
    for p in sorted(agents.glob('*.md')):
        try:
            text = p.read_text(encoding='utf-8')
            parts = text.split('---', 2)
            require(len(parts) == 3 and not parts[0].strip(), f'{p.name}: frontmatter missing')
            if len(parts) != 3:
                continue
            meta = yaml.load(parts[1], Loader=UniqueLoader)
            require(isinstance(meta, dict), f'{p.name}: invalid metadata')
            if not isinstance(meta, dict):
                continue
            allowed_fields = {'name','description','model','tools','disallowedTools'} | (DESIGN_FIELDS if p.stem in DESIGN else set())
            require(set(meta) <= allowed_fields, f'{p.name}: unexpected frontmatter fields in supported subset')
            require(meta.get('name') == p.stem, f'{p.name}: mismatched invocation name')
            require(isinstance(meta.get('description'), str) and bool(meta['description'].strip()), f'{p.name}: empty routing description')
            require(meta.get('model') in {'sonnet','opus','haiku','fable','inherit'}, f'{p.name}: unsupported model alias')
            listed = split_tools(meta['tools']) if 'tools' in meta else set()
            denied = split_tools(meta['disallowedTools']) if 'disallowedTools' in meta else set()
            spawn = {x for x in listed if x.startswith('Agent(')}
            if spawn:
                # Only the design director, run as the main thread, may name the specialists it spawns.
                require(p.stem == 'design-director', f'{p.name}: only design-director may list Agent(...)')
                for entry in spawn:
                    names = {n.strip() for n in entry[6:-1].split(',')}
                    require(names <= DESIGN - {'design-director'}, f'{p.name}: Agent(...) names unknown or non-design agents')
            require(not ((listed - spawn | denied)-TOOLS), f'{p.name}: unknown tool name')
            require('Agent' not in listed, f'{p.name}: nested delegation not part of flat policy')
            if p.stem in READ_ONLY:
                require(bool(listed) and not listed & {'Bash','Write','Edit','NotebookEdit','Agent'}, f'{p.name}: read-only reviewer has execution/write tools')
            if p.stem in INHERITED_TESTERS:
                require({'Write','Edit','NotebookEdit','Agent'} <= denied and 'tools' not in meta, f'{p.name}: browser tester restrictions missing')
            require('.claude/team/ENGINEERING-STANDARDS.md' in parts[2], f'{p.name}: shared contract not referenced')
        except (ValueError, yaml.YAMLError, OSError, TypeError) as exc:
            errors.append(f'{p.name}: {exc}')
    for p in sorted(root.glob('.claude/settings*.json')):
        try:
            obj = json.loads(p.read_text(), object_pairs_hook=unique_json)
            require(obj.get('$schema') == 'https://json.schemastore.org/claude-code-settings.json', f'{p.name}: incorrect schema reference')
            require(set(obj) <= {'$schema','permissions','hooks'}, f'{p.name}: unexpected top-level config field')
            permissions = obj.get('permissions', {})
            require(permissions.get('defaultMode') == 'acceptEdits', f'{p.name}: expected preserved acceptEdits autonomy')
            require(set(permissions) <= {'defaultMode','allow','ask','deny'}, f'{p.name}: unexpected permission field')
            for field in ['allow','ask','deny']:
                value = permissions.get(field, [])
                require(isinstance(value, list) and all(isinstance(x,str) for x in value), f'{p.name}: {field} must be string array')
                require(len(value) == len(set(value)), f'{p.name}: duplicated permission rules')
            broad = {'Bash','PowerShell','Bash(node *)','Bash(python *)','Bash(python3 *)','Bash(npx *)'}
            require(not broad.intersection(permissions.get('allow', [])), f'{p.name}: unrestricted interpreter/shell grant')
            if p.name == 'settings.json':
                require({'Bash(git push *)','Bash(git * push *)'} <= set(permissions.get('deny', [])), 'shared settings: no-push rules missing')
                hooks = obj.get('hooks', {}).get('SessionStart', [])
                require(len(hooks) == 1, 'SessionStart: expected one navigation hook')
                if len(hooks) == 1:
                    entries = hooks[0].get('hooks', [])
                    require(len(entries) == 1, 'SessionStart: expected one command')
                    if len(entries) == 1:
                        h = entries[0]
                        require(h.get('type') == 'command' and h.get('command') == 'node', 'SessionStart: Node exec form expected')
                        require(h.get('args') == ['${CLAUDE_PROJECT_DIR}/.claude/hooks/session-start.mjs'], 'SessionStart: unexpected path/arguments')
                        require(h.get('timeout') == 10, 'SessionStart: bounded timeout required')
        except (ValueError, OSError, TypeError) as exc:
            errors.append(f'{p.name}: {exc}')
    for required in ['.claude/settings.json','.claude/settings.local.json','.claude/hooks/session-start.mjs','CLAUDE.md','.claude/team/ENGINEERING-STANDARDS.md','.claude/team/PM-PLAYBOOK.md','.claude/team/PROJECT-PROFILE.md','.claude/team/STATE.md','.claude/team/HANDOFF.template.md','.claude/team/references/FRONTEND-CRAFT.md','.claude/team/references/NEXTJS.md','.claude/team/DESIGN-PLAYBOOK.md','.claude/team/DESIGN-STANDARDS.md','.claude/team/references/FIGMA-BUILD.md','.claude/team/DESIGN-STUDIO.md','docs/design/STUDIO-PLAYBOOK.md','docs/design/STUDIO-SETUP.md','docs/design/projects/TEMPLATE-PROJECT.md','specs/_template/requirements.md','specs/_template/design.md','specs/_template/tasks.md','evals/claude-team/scenarios.json']:
        require((root/required).is_file(), f'missing required file: {required}')
    # Resolve canonical .claude Markdown references, not arbitrary prose filenames.
    for p in root.rglob('*.md'):
        for reference in re.findall(r'(?<![\w/])(?:\.claude/[A-Za-z0-9_./-]+\.md)', p.read_text()):
            require((root/reference).is_file(), f'{p.relative_to(root)}: missing reference {reference}')
    bootstrap = root/'CLAUDE.md'
    if bootstrap.exists():
        for reference in re.findall(r'^@([^\s]+)', bootstrap.read_text(), re.M):
            require((root/reference).is_file(), f'bootstrap import missing: {reference}')
    scenario = root/'evals/claude-team/scenarios.json'
    if scenario.exists():
        try:
            cases = json.loads(scenario.read_text(), object_pairs_hook=unique_json)
            require(isinstance(cases, list) and len(cases) >= 12, 'at least 12 behavioral scenarios required')
            ids = set()
            for case in cases:
                require(set(case) == {'id','brief','expected','forbidden'}, 'scenario fields differ from documented schema')
                require(case['id'] not in ids, 'duplicate scenario ID')
                ids.add(case['id'])
                require(isinstance(case['brief'], str) and bool(case['brief']) and isinstance(case['expected'],list) and bool(case['expected']) and isinstance(case['forbidden'],list) and bool(case['forbidden']), 'scenario missing observable criteria')
        except (ValueError, OSError, TypeError, KeyError) as exc:
            errors.append(f'scenarios: {exc}')
    return errors

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    failures = validate(args.root.resolve())
    if failures:
        print('FAIL\n' + '\n'.join(failures))
        sys.exit(1)
    print('PASS: 34 agent definitions (17 development, 17 design), YAML/JSON structure, permissions, hook config, imports/references and evaluation schema.')
    print('Static kit-subset checks only. Claude loading and live behavioral evaluations are NOT RUN.')
