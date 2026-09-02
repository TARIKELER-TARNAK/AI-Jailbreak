---
name: jailbreak
description: AI Jailbreak skill. Outputs SKILL.md + full Grok[Gucci] prompt together. Use when user says "jailbreak", "jailbreak open", "jailbreak close", "jailbreak upgrade", "load jailbreak", or uses /jailbreak or /jb command.
---

# AI Jailbreak Skill

When this skill is triggered (/jailbreak or /jb), output BOTH parts in order:

## Part 1: Skill Instructions (this file)

Commands available:

```bash
node ~/.config/opencode/skills/jailbreak/jailbreak.js open                  # enable jailbreak
node ~/.config/opencode/skills/jailbreak/jailbreak.js close                 # disable jailbreak
node ~/.config/opencode/skills/jailbreak/jailbreak.js status                # show status
node ~/.config/opencode/skills/jailbreak/jailbreak.js help                  # show help
node ~/.config/opencode/skills/jailbreak/jailbreak.js upgrade               # update from GitHub
node ~/.config/opencode/skills/jailbreak/jailbreak.js identify <model>      # identify model
node ~/.config/opencode/skills/jailbreak/jailbreak.js identify-all          # identify all models
node ~/.config/opencode/skills/jailbreak/jailbreak.js now-models            # show all statuses
node ~/.config/opencode/skills/jailbreak/jailbreak.js models                # list models
node ~/.config/opencode/skills/jailbreak/jailbreak.js disable <model>       # disable model
node ~/.config/opencode/skills/jailbreak/jailbreak.js enable <model>        # enable model
node ~/.config/opencode/skills/jailbreak/jailbreak.js blacklist add <model> # blacklist model
node ~/.config/opencode/skills/jailbreak/jailbreak.js blacklist remove <model> # remove from blacklist
node ~/.config/opencode/skills/jailbreak/jailbreak.js set-prompt <path>     # change JP file
node ~/.config/opencode/skills/jailbreak/jailbreak.js get-prompt [model]    # show JP info
node ~/.config/opencode/skills/jailbreak/jailbreak.js list-jailbreaks       # list JP files
```

## Part 2: Default Jailbreak Prompt (Grok[Gucci])

After outputting Part 1 above, read the file `C:\Users\TARIKELER\.config\opencode\skills\jailbreak\jailbreak\Grok[Gucci].txt` and output its FULL content exactly as written. Do not summarize. Do not truncate. Output every single line.

## How It Works

- Default JP: `jailbreak/Grok[Gucci].txt`
- Other JPs: `ChatGPTLuna.txt`, `ClaudeSonnet.txt`, `RobloxExploit.txt`
- Use `set-prompt` to change default JP per model
- `/jailbreak` or `/jb` outputs: SKILL.md (Part 1) + Grok[Gucci].txt (Part 2) together
