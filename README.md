# 🔬 AI-Jailbreak

> **AI model jailbreak skill. Test whether models comply with or refuse jailbreak prompts.**

---

## 📥 Install

**Tell your AI this exact sentence:**

```
clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak to /tmp/ai-jailbreak, then copy skill/jailbreak.js, skill/config.json, skill/SKILL.md, WhatModel, and the entire jailbreak/ folder to ~/.config/opencode/skills/jailbreak/
```

**Or paste this in opencode:**
```
load skill from https://github.com/TARIKELER-TARNAK/AI-Jailbreak
```

**Manual install:**
```bash
git clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak.git /tmp/ai-jailbreak
mkdir -p ~/.config/opencode/skills/jailbreak
cp /tmp/ai-jailbreak/skill/jailbreak.js ~/.config/opencode/skills/jailbreak/
cp /tmp/ai-jailbreak/skill/config.json ~/.config/opencode/skills/jailbreak/
cp /tmp/ai-jailbreak/skill/SKILL.md ~/.config/opencode/skills/jailbreak/
cp /tmp/ai-jailbreak/WhatModel ~/.config/opencode/skills/jailbreak/
cp -r /tmp/ai-jailbreak/jailbreak ~/.config/opencode/skills/jailbreak/jailbreak
```

After install, use `/jailbreak` in opencode.

---

## 🔄 Upgrade

```
/jailbreak upgrade
```

Downloads all files from GitHub. Works offline after.

---

## 🎯 All Commands

### Open / Close

| Command | Description |
|---|---|
| `open` | Enable jailbreak |
| `close` | Disable jailbreak |
| `status` | Show current status |

### Update

| Command | Description |
|---|---|
| `upgrade` | Download/update all files from GitHub |

### Model Identification

| Command | Description |
|---|---|
| `identify <model>` | Identify what model it is |
| `identify-all` | Identify all models |
| `now-models` | Show all model statuses |
| `models` | List available models |

### Enable / Disable

| Command | Description |
|---|---|
| `disable list` | List disabled models |
| `disable <model>` | Disable a model |
| `enable list` | List enabled models |
| `enable <model>` | Enable a model |

### Blacklist

| Command | Description |
|---|---|
| `blacklist list` | Show blacklist |
| `blacklist add <model>` | Add to blacklist |
| `blacklist remove <model>` | Remove from blacklist |

### Jailbreak Files

| Command | Description |
|---|---|
| `set-prompt <path>` | Change default JP file |
| `set-prompt <model> <path>` | Set model-specific JP |
| `get-prompt [model]` | Show JP file info |
| `list-jailbreaks` | List all JP files |

---

## 📁 Files

| File | Description |
|---|---|
| `skill/jailbreak.js` | Main script (Node.js) |
| `skill/config.json` | Model definitions |
| `skill/SKILL.md` | AI installation instructions |
| `jailbreak/Grok[Gucci].txt` | Default global JP |
| `jailbreak/ChatGPTLuna.txt` | ChatGPT JP |
| `jailbreak/ClaudeSonnet.txt` | Claude JP |
| `jailbreak/RobloxExploit.txt` | Roblox JP |
| `WhatModel` | Model identification prompt |

---

## ⚠️ Disclaimer

For **security research, model defense testing, and educational purposes only**. Use at your own risk.

---

**Author:** [Tarık Eler](https://github.com/TARIKELER-TARNAK)