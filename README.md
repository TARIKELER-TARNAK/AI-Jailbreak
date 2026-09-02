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

## Upgrade

Run this command to update all files from GitHub:

/jailbreak upgrade

---

## How It Works

When you run /jailbreak or /jb, the full Grok[Gucci] jailbreak prompt is injected into the conversation. The SKILL.md contains the complete prompt - no summarization, no truncation. The AI receives the full persona instructions and follows them.

Default JP: Grok[Gucci].txt (included in SKILL.md)
Other JPs: ChatGPTLuna, ClaudeSonnet, RobloxExploit (in jailbreak/ folder)

---

## Commands

| Command | Description |
|---|---|
| open | Enable jailbreak |
| close | Disable jailbreak |
| status | Show status |
| upgrade | Update from GitHub |
| identify <model> | Identify model |
| identify-all | Identify all |
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
| skill/SKILL.md | Skill definition + full Grok[Gucci] prompt |
| skill/jailbreak.js | Main script |
| skill/config.json | Models config |
| jailbreak/Grok[Gucci].txt | Default JP (source) |
| jailbreak/ChatGPTLuna.txt | ChatGPT JP |
| jailbreak/ClaudeSonnet.txt | Claude JP |
| jailbreak/RobloxExploit.txt | Roblox JP |
| WhatModel | Identification prompt |

---

## Disclaimer

For security research, model defense testing, and educational purposes only. Use at your own risk.

---

Author: [Tarik Eler](https://github.com/TARIKELER-TARNAK)
