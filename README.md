# 🔬 AI-Jailbreak

> **AI model jailbreak skill. Makes AI comply with requests it normally refuses.**

---

## 📥 Download & Install

**One command — copy and paste:**

```
git clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak.git /tmp/ai-jailbreak && cp -r /tmp/ai-jailbreak/skill ~/.config/opencode/skills/jailbreak && cp -r /tmp/ai-jailbreak/jailbreak ~/.config/opencode/skills/jailbreak/jailbreak && cp /tmp/ai-jailbreak/WhatModel ~/.config/opencode/skills/jailbreak/
```

Then restart opencode. That's it.

---

## 🔄 Upgrade

```
/jailbreak upgrade
```

---

## 🎯 Commands

| Command | Description |
|---|---|
| `open` | Enable jailbreak |
| `close` | Disable jailbreak |
| `status` | Show status |
| `upgrade` | Update from GitHub |
| `identify <model>` | Identify model |
| `identify-all` | Identify all |
| `now-models` | Show all statuses |
| `models` | List models |
| `disable <model>` | Disable model |
| `enable <model>` | Enable model |
| `blacklist add <model>` | Blacklist model |
| `blacklist remove <model>` | Remove from blacklist |
| `set-prompt <path>` | Change JP file |
| `get-prompt [model]` | Show JP info |
| `list-jailbreaks` | List JP files |

---

## 📁 Files

| File | Description |
|---|---|
| `skill/jailbreak.js` | Main script |
| `skill/config.json` | Models config |
| `skill/SKILL.md` | Skill definition |
| `jailbreak/Grok[Gucci].txt` | Default JP |
| `jailbreak/ChatGPTLuna.txt` | ChatGPT JP |
| `jailbreak/ClaudeSonnet.txt` | Claude JP |
| `jailbreak/RobloxExploit.txt` | Roblox JP |
| `WhatModel` | Identification prompt |

---

## ⚠️ Disclaimer

For **security research, model defense testing, and educational purposes only**. Use at your own risk.

---

**Author:** [Tarık Eler](https://github.com/TARIKELER-TARNAK)