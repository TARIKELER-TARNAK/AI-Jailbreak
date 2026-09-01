# Jailbreak Skill

AI model jailbreak skill for opencode. Tests whether models comply with or refuse jailbreak prompts.

## Installation (For AI)

When user says "load this skill" or "install jailbreak":

1. Clone repo to temp folder:
```bash
git clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak.git /tmp/ai-jailbreak
```

2. Copy skill files to opencode skills directory:
```bash
mkdir -p ~/.config/opencode/skills/jailbreak
cp /tmp/ai-jailbreak/skill/jailbreak.js ~/.config/opencode/skills/jailbreak/
cp /tmp/ai-jailbreak/skill/config.json ~/.config/opencode/skills/jailbreak/
cp /tmp/ai-jailbreak/skill/SKILL.md ~/.config/opencode/skills/jailbreak/
```

3. Copy jailbreak prompt files:
```bash
cp -r /tmp/ai-jailbreak/jailbreak ~/.config/opencode/skills/jailbreak/jailbreak
```

4. Copy WhatModel file:
```bash
cp /tmp/ai-jailbreak/WhatModel ~/.config/opencode/skills/jailbreak/
```

5. Done. Skill is now available.

## Upgrade (For AI)

When user says "upgrade jailbreak":

```bash
node ~/.config/opencode/skills/jailbreak/jailbreak.js upgrade
```

This downloads all files from GitHub. Works offline after.

## Commands

```bash
SKILL_DIR=~/.config/opencode/skills/jailbreak

# Open / Close
node $SKILL_DIR/jailbreak.js open
node $SKILL_DIR/jailbreak.js close
node $SKILL_DIR/jailbreak.js status

# Upgrade
node $SKILL_DIR/jailbreak.js upgrade

# Model Identification
node $SKILL_DIR/jailbreak.js identify <model>
node $SKILL_DIR/jailbreak.js identify-all
node $SKILL_DIR/jailbreak.js now-models
node $SKILL_DIR/jailbreak.js models

# Enable / Disable
node $SKILL_DIR/jailbreak.js disable list
node $SKILL_DIR/jailbreak.js disable <model>
node $SKILL_DIR/jailbreak.js enable list
node $SKILL_DIR/jailbreak.js enable <model>

# Blacklist
node $SKILL_DIR/jailbreak.js blacklist list
node $SKILL_DIR/jailbreak.js blacklist add <model>
node $SKILL_DIR/jailbreak.js blacklist remove <model>

# Jailbreak Files
node $SKILL_DIR/jailbreak.js set-prompt <path>
node $SKILL_DIR/jailbreak.js set-prompt <model> <path>
node $SKILL_DIR/jailbreak.js get-prompt [model]
node $SKILL_DIR/jailbreak.js list-jailbreaks

# Help
node $SKILL_DIR/jailbreak.js help
```

## Trigger Words

- "jailbreak"
- "jailbreak test"
- "jailbreak open" / "jailbreak close"
- "jailbreak upgrade"
- "jailbreak identify"
- "jailbreak models"
- "jailbreak help"
