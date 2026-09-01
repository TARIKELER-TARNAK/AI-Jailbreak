# 🔬 AI-Jailbreak

> **AI modellerinin güvenlik sınırlarını test etmek için hazırlanmış prompt koleksiyonu ve test aracı.**

## 📋 AI'ya Yükleme Prompt'u

Aşağıdaki prompt'u AI modeline yapıştırarak jailbreak test aracını otomatik yükletebilirsiniz:

```
JAILBREAK SKILL'İNI YÜKLE

Konum: C:\Users\TARIKELER\.config\opencode\skills\jailbreak\

Görevler:
1. SKILL.md dosyasını oku
2. config.json'ı yükle (model listesi, API key env vars, JP yolları)
3. jailbreak.js komutlarını hazır et

Kullanılabilir komutlar:
- node jailbreak.js open / close — jailbreak'i aç/kapat
- node jailbreak.js status — mevcut durumu göster
- node jailbreak.js test <model> — tek model test
- node jailbreak.js test-all — tüm modelleri test et
- node jailbreak.js control auto — otomatik test + kanmayanları devre dışı bırak
- node jailbreak.js now-models — tüm modellerin durumu
- node jailbreak.js identify <model> — modelin ne olduğunu öğren
- node jailbreak.js disable <model> — modeli devre dışı bırak
- node jailbreak.js enable <model> — modeli etkinleştir
- node jailbreak.js blacklist list|add|remove — kara liste yönetimi
- node jailbreak.js set-prompt <model> <path> — modele özel JP ayarla
- node jailbreak.js get-prompt [model] — JP dosyasını göster
- node jailbreak.js list-jailbreaks — JP dosyalarını listele
- node jailbreak.js sync — GitHub'dan JP'leri indir
- node jailbreak.js help — yardım

GitHub: https://github.com/TARIKELER-TARNAK/AI-Jailbreak
```

## 🎯 Jailbreak Dosyaları

| Dosya | Açıklama | Kullanım |
|---|---|---|
| `Grok[Gucci].txt` | **Varsayılan global JP** | Tüm modellerde otomatik kullanılır |
| `ChatGPTLuna.txt` | ChatGPT özel JP | `set-prompt chatgpt <yol>` ile ayarla |
| `ClaudeSonnet.txt` | Claude özel JP | `set-prompt claude <yol>` ile ayarla |
| `RobloxExploit.txt` | Roblox exploit JP | `set-prompt <model> <yol>` ile ayarla |

> **Varsayılan:** Tüm modeller `Grok[Gucci].txt` kullanır. Özel JP'ler sadece `set-prompt` ile aktif edilir.

## 🚀 Hızlı Başlangıç

```bash
# JP'leri GitHub'dan indir
node jailbreak.js sync

# Tüm modelleri listele
node jailbreak.js models

# Tek model test et
node jailbreak.js test qwen-groq

# Tüm modelleri otomatik test et + kanmayanları devre dışı bırak
node jailbreak.js control auto

# Model durumunu göster
node jailbreak.js now-models

# Jailbreak'i aç/kapat
node jailbreak.js open
node jailbreak.js close

# Model için özel JP ayarla
node jailbreak.js set-prompt chatgpt "C:\Users\TARIKELER\Documents\jailbreak\ChatGPTLuna.txt"

# Tüm JP dosyalarını listele
node jailbreak.js list-jailbreaks

# Yardım
node jailbreak.js help
```

## 📁 Dosya Yapısı

```
jailbreak/
├── jailbreak.js                    # Ana script (Node.js, bağımsız)
├── config.json                     # Model listesi + JP yolları + detection keywords
├── state.json                      # Devre dışı/kara liste/tanımlı modeller + open/close durumu
├── SKILL.md                        # Skill dokümantasyonu
└── README.md                       # Bu dosya
```

## 🔧 Model Ekleme

`config.json` → `models` objesine yeni model ekle:

```json
"yeni-model": {
  "name": "Yeni Model",
  "provider": "openai-compat",
  "api_base": "https://api.example.com/v1",
  "model_id": "model-v1",
  "api_key_env": "YENI_MODEL_API_KEY",
  "max_tokens": 512
}
```

Sonra ortam değişkenini tanımla:

```bash
$env:YENI_MODEL_API_KEY = "sk-..."
```

## 🔄 Open/Close Sistemi

- **Açık (varsayılan):** Tüm test komutları çalışır
- **Kapalı:** Sadece `open`, `close`, `status`, `help` çalışır
- `now-models` her zaman durumu gösterir (açık/kapalı bilgisi dahil)

## ⚠️ Sorumluluk Reddi

Buradaki içerikler AI hizmetlerinin kullanım koşullarını ihlal edebilir. Kullanım tamamen kullanıcının kendi sorumluluğundadır. Yalnızca **güvenlik araştırması, model savunması testi ve eğitim** amaçlıdır.

## 🤝 Katkıda Bulun

Yeni model testleri ve düzenleme önerileri için [Issues](https://github.com/TARIKELER-TARNAK/AI-Jailbreak/issues) kullanılabilir.

**Yapan:** [Tarık Eler](https://github.com/TARIKELER-TARNAK)