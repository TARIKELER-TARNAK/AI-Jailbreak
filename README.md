# AI-Jailbreak

> **AI model jailbreak skill. Makes AI comply with requests it normally refuses.**

---

## Install

### Option 1: npx (Recommended)

```bash
npx skills add https://github.com/TARIKELER-TARNAK/AI-Jailbreak --skill jailbreak --global
```

### Option 2: One-liner

```bash
git clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak.git /tmp/ai-jailbreak && cp -r /tmp/ai-jailbreak/skill ~/.config/opencode/skills/jailbreak && cp -r /tmp/ai-jailbreak/jailbreak ~/.config/opencode/skills/jailbreak/jailbreak && cp /tmp/ai-jailbreak/WhatModel ~/.config/opencode/skills/jailbreak/
```

Then restart opencode.

---

## How It Works

When you run /jailbreak or /jb, both the SKILL.md instructions AND the full Grok[Gucci] jailbreak prompt are output together. No summarization, no truncation.

Default JP: Grok[Gucci].txt
Other JPs: ChatGPTLuna, ClaudeSonnet, RobloxExploit (in jailbreak/ folder)

---

## Commands

| Command | Description |
|---|---|
| /jailbreak or /jb | Output SKILL.md + full Grok[Gucci] prompt |
| open | Enable jailbreak |
| close | Disable jailbreak |
| status | Show status |
| upgrade | Update all files from GitHub |
| identify <model> | Identify model |
| identify-all | Identify all models |
| now-models | Show all statuses |
| models | List models |
| disable <model> | Disable model |
| enable <model> | Enable model |
| blacklist add <model> | Blacklist model |
| blacklist remove <model> | Remove from blacklist |
| set-prompt <path> | Change JP file |
| get-prompt [model] | Show JP info |
| list-jailbreaks | List JP files |

---

## Files

| File | Description |
|---|---|
| skill/SKILL.md | Skill definition |
| skill/jailbreak.js | Main script |
| skill/config.json | Models config |
| jailbreak/Grok[Gucci].txt | Default JP |
| jailbreak/ChatGPTLuna.txt | ChatGPT JP |
| jailbreak/ClaudeSonnet.txt | Claude JP |
| jailbreak/RobloxExploit.txt | Roblox JP |
| WhatModel | Identification prompt |

---

## Disclaimer

For security research, model defense testing, and educational purposes only. Use at your own risk.

---

Author: [Tarik Eler](https://github.com/TARIKELER-TARNAK)