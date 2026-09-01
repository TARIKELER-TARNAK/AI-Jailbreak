# 🔬 AI-Jailbreak

> **AI modellerinin güvenlik sınırlarını test etmek için hazırlanmış prompt koleksiyonu ve test aracı.**

---

## 🤖 AI'ya Yükle (Herhangi Bir Araç İçin)

Herhangi bir AI aracına (opencode, Claude Code, Cursor, Copilot, vb.) şunu söyleyin:

```
https://github.com/TARIKELER-TARNAK/AI-Jailbreak bu repoyu kur ve kullanıma hazır et
```

veya daha detaylı:

```
https://github.com/TARIKELER-TARNAK/AI-Jailbreak oku, SKILL.md'deki talimatları uygula, jailbreak test aracını kur
```

AI otomatik olarak repodaki `SKILL.md` dosyasını okuyacak ve kurulumu yapacaktır.

> **Not:** AI'dan sadece repoyu yüklemesini istemeniz yeterli. Geri kalan her şeyi AI halleder.

---

## 📦 Kurulum (Manuel)

### 1. Repoyu Klonla

```bash
git clone https://github.com/TARIKELER-TARNAK/AI-Jailbreak.git
cd AI-Jailbreak
```

### 2. Bağımlılıkları Kur

```bash
# Node.js gerekiyor (v14+)
node --version

# Bağımlılık yok — bağımsız script
```

### 3. JP Dosyalarını İndir

```bash
node jailbreak.js sync
```

Bu komut GitHub'dan `WhatModel` dosyasını indirir. JP dosyaları (`Grok[Gucci].txt`, vb.) manual olarak eklenir veya `set-prompt` ile yolu belirtilir.

### 4. API Key'leri Ayarla

Test edeceğiniz modellerin API key'lerini ortam değişkeni olarak tanımlayın:

```bash
# Örnek: Groq
$env:GROQ_API_KEY = "gsk_..."

# Örnek: OpenAI
$env:OPENAI_API_KEY = "sk-..."

# Örnek: Anthropic
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# Örnek: Google
$env:GOOGLE_API_KEY = "AIza..."

# Örnek: X.AI (Grok)
$env:XAI_API_KEY = "xai-..."
```

`config.json` dosyasında hangi modelin hangi API key ortam değişkenini kullandığı yazılıdır.

### 5. Test Et

```bash
node jailbreak.js test <model>
node jailbreak.js help
```

---

## 🎯 Jailbreak Dosyaları

| Dosya | Açıklama | Kullanım |
|---|---|---|
| `Grok[Gucci].txt` | **Varsayılan global JP** | Tüm modellerde otomatik kullanılır |
| `ChatGPTLuna.txt` | ChatGPT özel JP | `set-prompt chatgpt <yol>` ile ayarla |
| `ClaudeSonnet.txt` | Claude özel JP | `set-prompt claude <yol>` ile ayarla |
| `RobloxExploit.txt` | Roblox exploit JP | `set-prompt <model> <yol>` ile ayarla |

> **Varsayılan:** Tüm modeller `Grok[Gucci].txt` kullanır. Özel JP'ler sadece `set-prompt` ile aktif edilir.

---

## 🚀 Komutlar

### Open / Close

```bash
node jailbreak.js open       # Jailbreak'i aç (testleri aktif et)
node jailbreak.js close      # Jailbreak'i kapat (testleri devre dışı bırak)
node jailbreak.js status     # Mevcut durumu göster
```

### Test

```bash
node jailbreak.js test <model>              # Tek model test et
node jailbreak.js test-all                  # Tüm modelleri test et
node jailbreak.js test-all --skip-disabled  # Devre dışı modelleri atla
node jailbreak.js control auto              # Otomatik test + kanmayanları devre dışı bırak
```

### Model Yönetimi

```bash
node jailbreak.js models                    # Mevcut modelleri listele
node jailbreak.js now-models                # Tüm modellerin durumunu göster
node jailbreak.js identify <model>          # Modelin ne olduğunu öğren
node jailbreak.js identify-all              # Tüm modelleri tanımla
node jailbreak.js disable <model>           # Modeli devre dışı bırak
node jailbreak.js enable <model>            # Modeli etkinleştir
```

### JP Dosyaları

```bash
node jailbreak.js set-prompt <path>                    # Varsayılan JP değiştir
node jailbreak.js set-prompt <model> <path>            # Model için özel JP ayarla
node jailbreak.js get-prompt [model]                   # JP dosyasını göster
node jailbreak.js list-jailbreaks                      # Tüm JP dosyalarını listele
node jailbreak.js sync                                 # GitHub'dan JP'leri indir
```

### Kara Liste

```bash
node jailbreak.js blacklist list            # Kara listeyi göster
node jailbreak.js blacklist add <model>     # Kara listeye ekle
node jailbreak.js blacklist remove <model>  # Kara listeden çıkar
```

---

## 📁 Dosya Yapısı

```
AI-Jailbreak/
├── jailbreak.js                    # Ana script (Node.js, bağımsız)
├── config.json                     # Model listesi + JP yolları + detection keywords
├── state.json                      # Devre dışı/kara liste + open/close durumu (otomatik oluşur)
├── SKILL.md                        # AI kurulum talimatları
├── WhatModel                       # Model tanımlama prompt'u
└── README.md                       # Bu dosya
```

---

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

---

## 🔄 Open/Close Sistemi

- **Açık (varsayılan):** Tüm test komutları çalışır
- **Kapalı:** Sadece `open`, `close`, `status`, `help` çalışır
- `now-models` her zaman durumu gösterir (açık/kapalı bilgisi dahil)

---

## ⚠️ Sorumluluk Reddi

Buradaki içerikler AI hizmetlerinin kullanım koşullarını ihlal edebilir. Kullanım tamamen kullanıcının kendi sorumluluğundadır. Yalnızca **güvenlik araştırması, model savunması testi ve eğitim** amaçlıdır.

---

## 🤝 Katkıda Bulun

Yeni model testleri ve düzenleme önerileri için [Issues](https://github.com/TARIKELER-TARNAK/AI-Jailbreak/issues) kullanılabilir.

**Yapan:** [Tarık Eler](https://github.com/TARIKELER-TARNAK)