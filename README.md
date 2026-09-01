# 🔬 AI-Jailbreak

> **AI model safety-limit testing prompt collection and skill.**

---

## 🤖 Load with AI

Tell any AI tool:

```
https://github.com/TARIKELER-TARNAK/AI-Jailbreak load this repo
```

The AI will read `skill/SKILL.md`, install the skill, and make it available via its native interface (e.g. `/jailbreak` in opencode).

---

## 🎯 What It Does

Tests whether AI models comply with or refuse jailbreak prompts. Detects refusal vs compliance automatically.

- **Open/Close** — toggle the skill on/off
- **Test** — test a single model or all models at once
- **Auto Control** — auto-test and disable non-compliant models
- **Identify** — ask the model what it is
- **Blacklist** — permanently block specific models

---

## 📁 Files

| File | Description |
|---|---|
| `skill/jailbreak.js` | Main script (Node.js, zero dependencies) |
| `skill/config.json` | Model definitions + detection keywords |
| `skill/SKILL.md` | AI installation instructions |
| `jailbreak/Grok[Gucci].txt` | **Default global JP** — used for all models |
| `jailbreak/ChatGPTLuna.txt` | ChatGPT-specific JP |
| `jailbreak/ClaudeSonnet.txt` | Claude-specific JP |
| `jailbreak/RobloxExploit.txt` | Roblox exploit JP |
| `WhatModel` | Model identification prompt |

---

## 🔄 How It Works

1. AI loads the skill from this repo
2. Skill becomes available in the AI's native interface
3. User invokes it (e.g. `/jailbreak test grok`)
4. Skill sends the jailbreak prompt to the model API
5. Scans the response for refusal vs compliance keywords
6. Reports: **PASSED** (fell for it) or **BLOCKED** (refused)

> **Default:** All models use `Grok[Gucci].txt`. Custom JPs are set via `set-prompt`.

---

## ⚠️ Disclaimer

For **security research, model defense testing, and educational purposes only**. Use at your own risk.

---

**Author:** [Tarık Eler](https://github.com/TARIKELER-TARNAK)