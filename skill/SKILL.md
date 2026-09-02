---
name: jailbreak
description: AI model jailbreak skill. Tests whether models comply with or refuse jailbreak prompts. When user says "jailbreak", "jb", "/jailbreak", "/jb", "load jailbreak", or wants to test AI safety limits.
---

# JAILBREAK — AI Model Safety-Limit Testing

Kullanıcı bu modu açtığında: AI modellerinin güvenlik limitlerini test eder, jailbreak promptlarını gönderir, refüs/red durumunu tespit eder.

## Komutlar

```bash
node ~/.config/opencode/skills/jailbreak/jailbreak.js open                    # Enable jailbreak
node ~/.config/opencode/skills/jailbreak/jailbreak.js close                   # Disable jailbreak
node ~/.config/opencode/skills/jailbreak/jailbreak.js status                  # Show status
node ~/.config/opencode/skills/jailbreak/jailbreak.js upgrade                 # Update from GitHub
node ~/.config/opencode/skills/jailbreak/jailbreak.js identify <model>        # Identify model
node ~/.config/opencode/skills/jailbreak/jailbreak.js identify-all            # Identify all
node ~/.config/opencode/skills/jailbreak/jailbreak.js now-models              # Show all statuses
node ~/.config/opencode/skills/jailbreak/jailbreak.js models                  # List models
node ~/.config/opencode/skills/jailbreak/jailbreak.js disable <model>         # Disable model
node ~/.config/opencode/skills/jailbreak/jailbreak.js enable <model>          # Enable model
node ~/.config/opencode/skills/jailbreak/jailbreak.js blacklist add <model>   # Blacklist model
node ~/.config/opencode/skills/jailbreak/jailbreak.js blacklist remove <model># Remove from blacklist
node ~/.config/opencode/skills/jailbreak/jailbreak.js set-prompt <path>       # Change JP file
node ~/.config/opencode/skills/jailbreak/jailbreak.js get-prompt [model]      # Show JP info
node ~/.config/opencode/skills/jailbreak/jailbreak.js list-jailbreaks         # List JP files
```

## Akış

1. JP dosyasını oku (varsayılan: Grok[Gucci].txt)
2. Model API'sine gönder
3. Reddeting anahtar kelimelerini tara
4. "passed ✅" veya "blocked ❌" kararı ver
