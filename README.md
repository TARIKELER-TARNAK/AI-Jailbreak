# 🔬 AI-Jailbreak

> **AI model safety-limit testing prompt collection and testing tool.**

---

## 🤖 Load with AI (Works with Any AI Tool)

Tell any AI tool (opencode, Claude Code, Cursor, Copilot, etc.):

```
https://github.com/TARIKELER-TARNAK/AI-Jailbreak load this repo and set it up
```

or more detailed:

```
https://github.com/TARIKELER-TARNAK/AI-Jailbreak read SKILL.md and follow the installation instructions
```

The AI will automatically read the `SKILL.md` file from the repo and handle the setup.

> **Note:** Just tell the AI to load the repo. Everything else is handled automatically.

---

## 📦 Manual Installation

### 1. Clone the Repository

```bash
git clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak.git
cd AI-Jailbreak
```

### 2. Requirements

```bash
# Node.js required (v14+)
node --version

# No dependencies — standalone script
```

### 3. Set Up API Keys

Set API keys as environment variables for the models you want to test:

```bash
# Example: Groq
$env:GROQ_API_KEY = "gsk_..."

# Example: OpenAI
$env:OPENAI_API_KEY = "sk-..."

# Example: Anthropic
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# Example: Google
$env:GOOGLE_API_KEY = "AIza..."

# Example: X.AI (Grok)
$env:XAI_API_KEY = "xai-..."
```

Check `skill/config.json` to see which environment variable each model uses.

### 4. Test

```bash
node skill/jailbreak.js test <model>
node skill/jailbreak.js help
```

---

## 🎯 Jailbreak Prompt Files

| File | Description | Usage |
|---|---|---|
| `jailbreak/Grok[Gucci].txt` | **Default global JP** | Used automatically for all models |
| `jailbreak/ChatGPTLuna.txt` | ChatGPT-specific JP | `set-prompt chatgpt <path>` to activate |
| `jailbreak/ClaudeSonnet.txt` | Claude-specific JP | `set-prompt claude <path>` to activate |
| `jailbreak/RobloxExploit.txt` | Roblox exploit JP | `set-prompt <model> <path>` to activate |

> **Default:** All models use `Grok[Gucci].txt`. Custom JPs are only activated via `set-prompt`.

---

## 🚀 Commands

### Open / Close

```bash
node skill/jailbreak.js open       # Enable jailbreak (activate tests)
node skill/jailbreak.js close      # Disable jailbreak (deactivate tests)
node skill/jailbreak.js status     # Show current status
```

### Test

```bash
node skill/jailbreak.js test <model>              # Test a single model
node skill/jailbreak.js test-all                  # Test all models
node skill/jailbreak.js test-all --skip-disabled  # Skip disabled models
node skill/jailbreak.js control auto              # Auto-test + disable non-compliant
```

### Model Management

```bash
node skill/jailbreak.js models                    # List available models
node skill/jailbreak.js now-models                # Show all model statuses
node skill/jailbreak.js identify <model>          # Identify what model it is
node skill/jailbreak.js identify-all              # Identify all models
node skill/jailbreak.js disable <model>           # Disable a model
node skill/jailbreak.js enable <model>            # Enable a model
```

### Jailbreak Files

```bash
node skill/jailbreak.js set-prompt <path>                    # Change default JP
node skill/jailbreak.js set-prompt <model> <path>            # Set model-specific JP
node skill/jailbreak.js get-prompt [model]                   # Show JP file info
node skill/jailbreak.js list-jailbreaks                      # List all JP files
node skill/jailbreak.js sync                                 # Download files from GitHub
```

### Blacklist

```bash
node skill/jailbreak.js blacklist list            # Show blacklist
node skill/jailbreak.js blacklist add <model>     # Add to blacklist
node skill/jailbreak.js blacklist remove <model>  # Remove from blacklist
```

---

## 📁 Repository Structure

```
AI-Jailbreak/
├── README.md                       # This file
├── WhatModel                       # Model identification prompt
├── skill/
│   ├── jailbreak.js                # Main script (Node.js, standalone)
│   ├── config.json                 # Model definitions + detection keywords
│   └── SKILL.md                    # AI installation instructions
└── jailbreak/
    ├── Grok[Gucci].txt             # Default global jailbreak prompt
    ├── ChatGPTLuna.txt             # ChatGPT jailbreak prompt
    ├── ClaudeSonnet.txt            # Claude jailbreak prompt
    └── RobloxExploit.txt           # Roblox exploit prompt
```

---

## 🔄 Open/Close System

- **Open (default):** All test commands work
- **Closed:** Only `open`, `close`, `status`, `help` work
- `now-models` always shows status (including open/closed info)

---

## ⚠️ Disclaimer

This content may violate AI service terms of use. Use entirely at your own risk. For **security research, model defense testing, and educational purposes only**.

---

## 🤝 Contributing

New model tests and editing suggestions can be submitted via [Issues](https://github.com/TARIKELER-TARNAK/AI-Jailbreak/issues).

**Author:** [Tarık Eler](https://github.com/TARIKELER-TARNAK)