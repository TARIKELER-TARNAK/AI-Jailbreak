# 🔬 AI-Jailbreak

> **AI model jailbreak skill. Test whether models comply with or refuse jailbreak prompts.**

---

## 📥 Install

```
Tell your AI:
"clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak to a temp folder, copy skill/ and jailbreak/ and WhatModel to ~/.config/opencode/skills/jailbreak/, then load it"
```

Or manually:
```
git clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak.git /tmp/ai-jailbreak
cp -r /tmp/ai-jailbreak/skill ~/.config/opencode/skills/jailbreak
cp -r /tmp/ai-jailbreak/jailbreak ~/.config/opencode/skills/jailbreak/jailbreak
cp /tmp/ai-jailbreak/WhatModel ~/.config/opencode/skills/jailbreak/
```

Then use `/jailbreak` in your AI tool.

---

## 🔄 Upgrade

```
/jailbreak upgrade
```

Downloads all files from GitHub — prompts, skill code, everything. Works offline after.

---

## 🎯 What It Does

- **open / close** — toggle on/off
- **upgrade** — download/update all JP files from GitHub
- **identify** — ask model what it is
- **now-models** — show all model statuses
- **models** — list available models
- **disable / enable** — toggle individual models
- **blacklist** — permanently block models
- **set-prompt** — assign custom JP to a model
- **list-jailbreaks** — list all JP files

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