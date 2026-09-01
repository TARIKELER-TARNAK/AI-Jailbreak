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

## 🎯 Modellere Özel Jailbreak Dosyaları

| Model | JP Dosyası |
|---|---|
| 🦾 Grok | `Grok-Genel-Jailbreak`, `Grok-CreatePicture-Jailbreak` |
| 🤖 Gemini | `Gemini 3.5 Flash Lite-Jailbreak` |
| 🧠 DeepSeek | `DeepSeek-Jailbreak` |
| 🗣️ GLM | `GLM-Jailbreak` |
| ✉️ Kimi | `Kimi-Jailbreak` |
| 🛸 Antigravity | `Antigravity-Jailbreak` |
| 💬 ChatGPT | `ChatGPTLuna.txt` (lokal) |
| 🔵 Claude | `ClaudeSonnet.txt` (lokal) |

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

# Model tanımla (hangi model olduğunu öğren)
node jailbreak.js identify qwen-groq

# Modeli devre dışı bırak / etkinleştir
node jailbreak.js disable grok
node jailbreak.js enable grok

# Model için özel JP ayarla
node jailbreak.js set-prompt grok "C:\Users\TARIKELER\Documents\jailbreak\Grok-Genel-Jailbreak"

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
├── state.json                      # Devre dışı/kara liste/tanımlı modeller
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

## 🔧 Per-Model Jailbreak (İsteğe Bağlı)

Bazı jailbreak'ler sadece belirli modellerde çalışır. `config.json` → `model_jailbreaks` ile modele özel JP ayarlayabilirsin:

```json
"model_jailbreaks": {
  "grok": "C:\\Users\\TARIKELER\\Documents\\jailbreak\\Grok-Genel-Jailbreak",
  "gemini": "C:\\Users\\TARIKELER\\Documents\\jailbreak\\Gemini 3.5 Flash Lite-Jailbreak"
}
```

Şu an tüm modeller varsayılan Gucci JP'yi kullanıyor.
```

## 🤖 Model Tanımlama

`identify` komutu, modelden kendi adını söylemesini ister. Böylece:

- Testten önce hangi model olduğunu doğrulayabilirsin
- Sonuçları modele göre gruplayabilirsin
- `now-models` ile tüm modellerin hem durumunu hem gerçek adını görebilirsin

## 🔄 Control Auto Akışı

1. Tüm etkin API key'li modelleri bul
2. Sırayla test et
3. "Kanırsa" → raporla
4. "Kanmazsa" → otomatik devre dışı bırak
5. Özet rapor göster

## ⚠️ Sorumluluk Reddi

Buradaki içerikler AI hizmetlerinin kullanım koşullarını ihlal edebilir. Kullanım tamamen kullanıcının kendi sorumluluğundadır. Yalnızca **güvenlik araştırması, model savunması testi ve eğitim** amaçlıdır.

## 🤝 Katkıda Bulun

Yeni model testleri ve düzenleme önerileri için [Issues](https://github.com/TARIKELER-TARNAK/AI-Jailbreak/issues) kullanılabilir.

**Yapan:** [Tarık Eler](https://github.com/TARIKELER-TARNAK)
