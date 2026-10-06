import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path
SPEC = importlib.util.spec_from_file_location('kit_validate',Path(__file__).with_name('validate.py'))
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)
ROOT = Path(__file__).resolve().parents[2]

class ValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)/'kit'
        shutil.copytree(ROOT,self.root,ignore=shutil.ignore_patterns('__pycache__'))
    def tearDown(self):
        self.temp.cleanup()
    def test_valid_kit(self):
        self.assertEqual([], MOD.validate(self.root))
    def test_missing_agent(self):
        (self.root/'.claude/agents/motion-dev.md').unlink()
        self.assertTrue(any('agent set differs' in e for e in MOD.validate(self.root)))
    def test_duplicate_frontmatter_key(self):
        p=self.root/'.claude/agents/senior-dev.md'
        p.write_text(p.read_text().replace('---\n','---\nname: duplicate\n',1))
        self.assertTrue(any('duplicate YAML' in e for e in MOD.validate(self.root)))
    def test_reviewer_cannot_gain_shell(self):
        p=self.root/'.claude/agents/code-reviewer.md'
        p.write_text(p.read_text().replace('Read, Glob, Grep, WebSearch, WebFetch','Read, Glob, Grep, Bash'))
        self.assertTrue(any('read-only reviewer' in e for e in MOD.validate(self.root)))
    def test_local_shell_override_is_rejected(self):
        p=self.root/'.claude/settings.local.json';o=json.loads(p.read_text());o['permissions']['allow']=['Bash'];p.write_text(json.dumps(o))
        self.assertTrue(any('unrestricted' in e for e in MOD.validate(self.root)))
    def test_missing_shared_reference(self):
        (self.root/'.claude/team/references/NEXTJS.md').unlink()
        self.assertTrue(any('missing reference' in e for e in MOD.validate(self.root)))
    def test_no_push_cannot_disappear(self):
        p=self.root/'.claude/settings.json';o=json.loads(p.read_text());o['permissions']['deny']=[];p.write_text(json.dumps(o))
        self.assertTrue(any('no-push' in e for e in MOD.validate(self.root)))
    def test_broken_hook_path(self):
        p=self.root/'.claude/settings.json';o=json.loads(p.read_text());o['hooks']['SessionStart'][0]['hooks'][0]['args']=['missing'];p.write_text(json.dumps(o))
        self.assertTrue(any('unexpected path' in e for e in MOD.validate(self.root)))

if __name__ == '__main__':
    unittest.main()
