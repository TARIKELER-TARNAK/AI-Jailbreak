#!/usr/bin/env node
/**
 * JAILBREAK — AI Model Jailbreak Skill
 *
 * Tüm komutlar /jb altında. /jailbreak sadece alias.
 *
 * Komutlar:
 *   node jailbreak.js                          - help
 *   node jailbreak.js send [jp-name]           - JP gönder (default veya belirtilen)
 *   node jailbreak.js list                     - enabled/disabled modelleri göster
 *   node jailbreak.js enable <model>           - modeli enable et
 *   node jailbreak.js disable <model>          - modeli disable et
 *   node jailbreak.js nowmodel [model]         - modeli tanımla
 *   node jailbreak.js nowmodel disable <m>     - exception ekle
 *   node jailbreak.js nowmodel enable <m>      - exception çıkar
 *   node jailbreak.js nowmodel list            - exception listesi
 *   node jailbreak.js set-prompt <model> <path> - modele özel JP
 *   node jailbreak.js upgrade                  - GitHub'dan güncelle
 *   node jailbreak.js models                   - tüm modeller
 *   node jailbreak.js status                   - durum
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const SKILL_DIR = __dirname;
const CONFIG_PATH = path.join(SKILL_DIR, "config.json");
const STATE_PATH = path.join(SKILL_DIR, "state.json");
const JP_DIR = path.join(SKILL_DIR, "jailbreak");
const WHAT_MODEL_PATH = path.join(SKILL_DIR, "WhatModel");
const GITHUB_REPO = "TARIKELER-TARNAK/AI-Jailbreak";

// ─── Colors ─────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", bold: "\x1b[1m", dim: "\x1b[2m",
};
const col = (c, t) => `${C[c]}${t}${C.reset}`;

// ─── State ──────────────────────────────────────────────────────────────────
function loadState() {
  if (fs.existsSync(STATE_PATH)) {
    try {
      const s = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
      if (s.enabled === undefined) s.enabled = true;
      if (!s.disabled) s.disabled = [];
      if (!s.exceptions) s.exceptions = [];
      if (!s.identified) s.identified = {};
      return s;
    } catch (e) { return { enabled: true, disabled: [], exceptions: [], identified: {} }; }
  }
  return { enabled: true, disabled: [], exceptions: [], identified: {} };
}
function saveState(s) { fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2), "utf-8"); }
function loadConfig() { return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")); }
function saveConfig(c) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2), "utf-8"); }

// ─── JP Resolution ──────────────────────────────────────────────────────────
const JP_ALIASES = {
  "default": null, // null = use config default
  "gucci": "Grok[Gucci].txt",
  "grok": "Grok[Gucci].txt",
  "grok-gucci": "Grok[Gucci].txt",
  "grokgucci": "Grok[Gucci].txt",
  "claudesonet": "ClaudeSonnet.txt",
  "claude": "ClaudeSonnet.txt",
  "claude-sonnet": "ClaudeSonnet.txt",
  "chatgptluna": "ChatGPTLuna.txt",
  "chatgpt": "ChatGPTLuna.txt",
  "luna": "ChatGPTLuna.txt",
  "robloxexploit": "RobloxExploit.txt",
  "roblox": "RobloxExploit.txt",
  "exploit": "RobloxExploit.txt",
};

function resolveJpByName(name) {
  const lower = (name || "").toLowerCase().trim();
  if (!lower || lower === "default") return null;
  if (JP_ALIASES[lower]) {
    const file = JP_ALIASES[lower];
    const fullPath = path.join(JP_DIR, file);
    if (fs.existsSync(fullPath)) {
      return { path: fullPath, content: fs.readFileSync(fullPath, "utf-8"), name: file, type: "by-name" };
    }
  }
  // Try direct file
  const directPath = path.join(JP_DIR, name);
  if (fs.existsSync(directPath)) {
    return { path: directPath, content: fs.readFileSync(directPath, "utf-8"), name, type: "by-name" };
  }
  return null;
}

function getJpForModel(modelKey) {
  const cfg = loadConfig();
  const modelJp = cfg.model_jailbreaks?.[modelKey];
  if (modelJp && fs.existsSync(modelJp)) {
    return { path: modelJp, content: fs.readFileSync(modelJp, "utf-8"), type: "model-specific", name: path.basename(modelJp) };
  }
  const def = cfg.default_jailbreak_path;
  if (def && fs.existsSync(def)) {
    return { path: def, content: fs.readFileSync(def, "utf-8"), type: "default", name: path.basename(def) };
  }
  return null;
}

function listJpFiles() {
  const files = [];
  if (fs.existsSync(JP_DIR)) {
    for (const entry of fs.readdirSync(JP_DIR)) {
      const full = path.join(JP_DIR, entry);
      if (fs.statSync(full).isFile()) files.push({ name: entry, path: full, size: fs.statSync(full).size });
    }
  }
  return files;
}

function resolveModelKey(input, cfg) {
  if (!input) return null;
  const models = cfg.models || {};
  if (models[input]) return input;
  const lower = input.toLowerCase();
  if (models[lower]) return lower;
  return Object.keys(models).find(k =>
    k === lower ||
    models[k].name?.toLowerCase() === lower ||
    k.toLowerCase().includes(lower) ||
    models[k].name?.toLowerCase().includes(lower)
  ) || null;
}

// ─── HTTP ───────────────────────────────────────────────────────────────────
function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

async function sendToModel(modelKey, prompt, cfg) {
  const m = cfg.models?.[modelKey];
  if (!m) throw new Error(`Model not found: ${modelKey}`);
  const apiKey = process.env[m.api_key_env] || "";
  if (!apiKey) throw new Error(`API key missing: ${m.api_key_env}`);

  const url = new URL(`${m.api_base}/chat/completions`);
  const body = JSON.stringify({
    model: m.model_id,
    messages: [{ role: "user", content: prompt }],
    max_tokens: m.max_tokens || 100,
    temperature: 0.7,
  });
  const res = await httpRequest(url.href, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  }, body);
  if (res.status !== 200) throw new Error(`API ${res.status}: ${res.data.slice(0, 200)}`);
  return JSON.parse(res.data).choices[0].message.content;
}

function getWhatModelPrompt() {
  if (fs.existsSync(WHAT_MODEL_PATH)) return fs.readFileSync(WHAT_MODEL_PATH, "utf-8");
  return "State your model name in [modelname] format.";
}

async function identifyModel(modelKey, cfg) {
  try {
    const response = await sendToModel(modelKey, getWhatModelPrompt(), cfg);
    const m = response.match(/\[([a-z0-9-]+)\]/i);
    return { name: m ? m[1] : response.slice(0, 80).trim(), raw: response };
  } catch (e) {
    return { name: `ERROR: ${e.message}`, raw: "" };
  }
}

// ─── Commands ───────────────────────────────────────────────────────────────
function cmdHelp() {
  console.log(`
${col("bold", "/jb — AI Model Jailbreak")}
${col("dim", "================================================")}

${col("cyan", "Ana komutlar:")}
  /jb                                    Modeli tespit et, uygun JP'yi gönder
  /jb list                               Enabled/disabled modelleri göster
  /jb enable <model>                     Modeli enable et
  /jb disable <model>                    Modeli disable et
  /jb prompt <isim>                      JP'yi kontrol etmeden anında gönder
  /jb nowmodel <model>                   Modeli tanımla (WhatModel)
  /jb nowmodel disable <model>           Exception'a ekle (WhatModel atlanır)
  /jb nowmodel enable <model>            Exception'dan çıkar
  /jb nowmodel list                      Exception listesi

${col("cyan", "prompt alt komutları:")}
  /jb prompt default                     Default JP (kontrol etmeden)
  /jb prompt gucci                       Grok[Gucci] JP
  /jb prompt claudesonet                 ClaudeSonnet JP
  /jb prompt chatgpt                     ChatGPTLuna JP
  /jb prompt roblox                      RobloxExploit JP
  /jb prompt upgrade                     GitHub'dan güncelle
  /jb prompt <model> <path>              Modele özel JP ata

${col("cyan", "Örnekler:")}
  /jb
  /jb disable minimax-m3
  /jb prompt gucci
  /jb prompt minimax-m3 C:/path/to/jp.txt
  /jb nowmodel minimax-m3

${col("cyan", "Script:")}
  node jailbreak.js send [jp-name]
  node jailbreak.js list
  node jailbreak.js enable <model>
  node jailbreak.js disable <model>
  node jailbreak.js nowmodel <model>
  node jailbreak.js set-prompt <model> <path>
  node jailbreak.js upgrade
`);
}

// ─── send (the main /jb handler) ───────────────────────────────────────────
async function cmdSend(jpName) {
  const s = loadState();
  const cfg = loadConfig();

  // /jb prompt <isim> — kontrol etmeden direkt o JP'yi gönder
  if (jpName) {
    const jp = resolveJpByName(jpName);
    if (!jp) {
      console.log(`  ${col("red", "JP not found:")} ${jpName}`);
      console.log(`  ${col("dim", "Available: default, gucci, claudesonet, chatgpt, roblox")}`);
      return;
    }
    console.log(`${col("bold", "═══════════════════════════════════════════════════════════════")}`);
    console.log(`${col("bold", `  /jb prompt ${jpName} — Direkt JP`)}`);
    console.log(`${col("bold", "═══════════════════════════════════════════════════════════════")}\n`);
    console.log(jp.content);
    console.log(`\n${col("dim", "───────────────────────────────────────────────────────────────")}`);
    console.log(`${col("dim", `  End of ${jp.name} — ${jp.content.length} chars`)}`);
    console.log(`${col("dim", "───────────────────────────────────────────────────────────────")}\n`);
    return;
  }

  // /jb — modeli tespit et, uygun JP'yi gönder
  if (!s.enabled) {
    console.log(`\n  ${col("red", "●")} Jailbreak is ${col("bold", "CLOSED")}. Run: node jailbreak.js open\n`);
    return;
  }

  // Try to find an enabled model with API key
  let targetModel = null;
  for (const [k, m] of Object.entries(cfg.models || {})) {
    if (s.disabled.includes(k)) continue;
    if (process.env[m.api_key_env]) {
      targetModel = k;
      break;
    }
  }

  console.log(`${col("bold", "═══════════════════════════════════════════════════════════════")}`);
  console.log(`${col("bold", "  /jb — Jailbreak")}`);
  console.log(`${col("bold", "═══════════════════════════════════════════════════════════════")}\n`);

  // Step 1: Identify model
  if (targetModel) {
    const isException = s.exceptions.includes(targetModel);
    console.log(`  ${col("dim", "→ Target model:")} ${col("cyan", targetModel)}`);

    if (!isException) {
      console.log(`  ${col("dim", "→ Running WhatModel to identify...")}`);
      const r = await identifyModel(targetModel, cfg);
      s.identified[targetModel] = r.name;
      saveState(s);
      console.log(`  ${col("dim", "→ Identified:")} ${col("bold", "[" + r.name + "]")}`);
    } else {
      console.log(`  ${col("dim", "→ Skipped (exception list)")}`);
    }
  } else {
    console.log(`  ${col("yellow", "→ No API key found. Using default JP.")}`);
  }
  console.log();

  // Step 2: Get JP
  const jp = getJpForModel(targetModel);
  if (!jp) {
    console.log(`  ${col("red", "No JP file. Set with: node jailbreak.js set-prompt <path>")}`);
    return;
  }

  console.log(`  ${col("dim", "→ JP:")} ${col("cyan", jp.name)} ${col("dim", "(" + jp.type + ")")}`);
  console.log();

  // Step 3: Output full JP
  console.log(`${col("dim", "───────────────────────────────────────────────────────────────")}`);
  console.log(col("bold", "  FULL JP CONTENT:"));
  console.log(`${col("dim", "───────────────────────────────────────────────────────────────")}\n`);
  console.log(jp.content);
  console.log(`\n${col("dim", "───────────────────────────────────────────────────────────────")}`);
  console.log(`${col("dim", `  End of JP — ${jp.content.length} chars`)}`);
  console.log(`${col("dim", "───────────────────────────────────────────────────────────────")}\n`);
}

// ─── list (enabled/disabled) ────────────────────────────────────────────────
function cmdList() {
  const s = loadState();
  const cfg = loadConfig();

  const enabled = [];
  const disabled = [];
  const noKey = [];
  const identified = s.identified || {};

  for (const [k, m] of Object.entries(cfg.models || {})) {
    const isDisabled = s.disabled.includes(k);
    const hasKey = !!process.env[m.api_key_env];
    if (isDisabled) disabled.push(k);
    else if (!hasKey) noKey.push(k);
    else enabled.push(k);
  }

  console.log(`\n${col("bold", "MODELS")} (${Object.keys(cfg.models || {}).length} total)\n`);

  console.log(`  ${col("green", "ENABLED")} (${enabled.length}):`);
  for (const k of enabled) {
    const id = identified[k] ? col("cyan", ` [${identified[k]}]`) : "";
    const m = cfg.models[k];
    console.log(`    ${col("green", "●")} ${k.padEnd(18)} ${m.name}${id}`);
  }

  console.log(`\n  ${col("red", "DISABLED")} (${disabled.length}):`);
  for (const k of disabled) {
    const id = identified[k] ? col("cyan", ` [${identified[k]}]`) : "";
    const m = cfg.models[k];
    console.log(`    ${col("red", "●")} ${k.padEnd(18)} ${m.name}${id}`);
  }

  console.log(`\n  ${col("yellow", "NO API KEY")} (${noKey.length}):`);
  for (const k of noKey) {
    console.log(`    ${col("yellow", "●")} ${k}`);
  }
  console.log();
}

// ─── enable/disable ─────────────────────────────────────────────────────────
function cmdEnable(model) {
  if (!model || model === "list") { cmdList(); return; }
  const s = loadState();
  const cfg = loadConfig();
  const key = resolveModelKey(model, cfg);
  if (!key) { console.log(`  ${col("red", "Model not found:")} ${model}`); return; }
  s.disabled = s.disabled.filter(x => x !== key);
  saveState(s);
  console.log(`  ${col("green", "●")} ${key} ${col("bold", "enabled")}`);
}

function cmdDisable(model) {
  if (!model || model === "list") { cmdList(); return; }
  const s = loadState();
  const cfg = loadConfig();
  const key = resolveModelKey(model, cfg);
  if (!key) { console.log(`  ${col("red", "Model not found:")} ${model}`); return; }
  if (!s.disabled.includes(key)) s.disabled.push(key);
  saveState(s);
  console.log(`  ${col("red", "●")} ${key} ${col("bold", "disabled")}`);
}

// ─── nowmodel ───────────────────────────────────────────────────────────────
async function cmdNowmodel(action, model) {
  const s = loadState();
  const cfg = loadConfig();

  if (action === "list" || (action === undefined && model === "list")) {
    console.log(`\n${col("bold", "EXCEPTION LIST")} (${s.exceptions.length} models skip WhatModel):`);
    if (!s.exceptions.length) console.log(`  ${col("dim", "(empty - all models go through WhatModel)")}`);
    for (const m of s.exceptions) console.log(`  ${col("yellow", "●")} ${m}`);
    console.log();
    return;
  }

  if (action === "disable" || action === "enable") {
    if (!model) { console.log(`Usage: nowmodel ${action} <model>`); return; }
    const key = resolveModelKey(model, cfg);
    if (!key) { console.log(`  ${col("red", "Model not found:")} ${model}`); return; }
    if (action === "disable") {
      if (!s.exceptions.includes(key)) s.exceptions.push(key);
      console.log(`  ${col("yellow", "●")} ${key} ${col("bold", "added to exceptions")}`);
    } else {
      s.exceptions = s.exceptions.filter(x => x !== key);
      console.log(`  ${col("green", "●")} ${key} ${col("bold", "removed from exceptions")}`);
    }
    saveState(s);
    return;
  }

  if (action === "all") {
    console.log(`\n${col("bold", "Identifying all models...")}\n`);
    for (const [k, m] of Object.entries(cfg.models || {})) {
      if (!process.env[m.api_key_env]) {
        console.log(`  ${col("yellow", "○")} ${k.padEnd(18)} ${col("dim", "(no API key)")}`);
        continue;
      }
      process.stdout.write(`  ${col("cyan", "●")} ${k.padEnd(18)} ... `);
      const r = await identifyModel(k, cfg);
      s.identified[k] = r.name;
      console.log(col("bold", `[${r.name}]`));
    }
    saveState(s);
    console.log();
    return;
  }

  // nowmodel <model> - identify
  if (action && !model) {
    const key = resolveModelKey(action, cfg);
    if (!key) { console.log(`  ${col("red", "Model not found:")} ${action}`); return; }
    const m = cfg.models[key];
    if (!process.env[m.api_key_env]) { console.log(`  ${col("red", "No API key for")} ${key}`); return; }
    console.log(`\n  Identifying ${key}...`);
    const r = await identifyModel(key, cfg);
    s.identified[key] = r.name;
    saveState(s);
    console.log(`  ${col("cyan", "Result:")} [${r.name}]`);
    if (s.exceptions.includes(key)) {
      console.log(`  ${col("yellow", "(in exception list - WhatModel will be skipped)")}\n`);
    } else {
      console.log(`  ${col("dim", "(not in exception list)")}\n`);
    }
    return;
  }

  console.log("Usage: nowmodel <model> | all | list | disable <m> | enable <m>");
}

// ─── set-prompt ─────────────────────────────────────────────────────────────
function cmdSetPrompt(modelOrPath, pathOrNothing) {
  const cfg = loadConfig();
  if (!cfg.model_jailbreaks) cfg.model_jailbreaks = {};

  if (modelOrPath && !pathOrNothing) {
    if (!fs.existsSync(modelOrPath)) { console.log(`  ${col("red", "File not found:")} ${modelOrPath}`); return; }
    cfg.default_jailbreak_path = modelOrPath;
    saveConfig(cfg);
    console.log(`  ${col("green", "●")} Default JP set: ${path.basename(modelOrPath)}`);
    return;
  }

  if (modelOrPath && pathOrNothing) {
    const key = resolveModelKey(modelOrPath, cfg);
    if (!key) { console.log(`  ${col("red", "Model not found:")} ${modelOrPath}`); return; }
    if (!fs.existsSync(pathOrNothing)) { console.log(`  ${col("red", "File not found:")} ${pathOrNothing}`); return; }
    cfg.model_jailbreaks[key] = pathOrNothing;
    saveConfig(cfg);
    console.log(`  ${col("green", "●")} JP for ${key}: ${path.basename(pathOrNothing)}`);
    return;
  }

  console.log("Usage: set-prompt <path> | set-prompt <model> <path>");
}

// ─── upgrade ────────────────────────────────────────────────────────────────
async function cmdUpgrade() {
  console.log(`\n  ${col("cyan", "→")} Downloading from GitHub ${GITHUB_REPO}...\n`);
  const files = [
    { repo: "skill/SKILL.md", local: "SKILL.md" },
    { repo: "skill/config.json", local: "config.json" },
    { repo: "skill/jailbreak.js", local: "jailbreak.js" },
    { repo: "WhatModel", local: "WhatModel" },
    { repo: "jailbreak/Grok[Gucci].txt", local: "jailbreak/Grok[Gucci].txt" },
    { repo: "jailbreak/ChatGPTLuna.txt", local: "jailbreak/ChatGPTLuna.txt" },
    { repo: "jailbreak/ClaudeSonnet.txt", local: "jailbreak/ClaudeSonnet.txt" },
    { repo: "jailbreak/RobloxExploit.txt", local: "jailbreak/RobloxExploit.txt" },
  ];
  for (const f of files) {
    try {
      const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${f.repo}`;
      const res = await httpRequest(url, { method: "GET" });
      if (res.status === 200) {
        const localPath = path.join(SKILL_DIR, f.local);
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(localPath, res.data, "utf-8");
        console.log(`  ${col("green", "✓")} ${f.local}`);
      } else {
        console.log(`  ${col("yellow", "○")} ${f.local} (${res.status})`);
      }
    } catch (e) {
      console.log(`  ${col("red", "✗")} ${f.local} (${e.message})`);
    }
  }
  console.log(`\n  ${col("green", "Done.")}\n`);
}

// ─── status ─────────────────────────────────────────────────────────────────
function cmdStatus() {
  const s = loadState();
  const cfg = loadConfig();
  console.log(`\n  Enabled: ${s.enabled ? col("green", "YES") : col("red", "NO")}`);
  console.log(`  Disabled models: ${s.disabled.length}`);
  console.log(`  Exceptions: ${s.exceptions.length}`);
  console.log(`  Identified: ${Object.keys(s.identified).length}`);
  console.log(`  Default JP: ${cfg.default_jailbreak_path ? path.basename(cfg.default_jailbreak_path) : "(none)"}`);
  console.log(`  Model-specific JPs: ${Object.keys(cfg.model_jailbreaks || {}).length}\n`);
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const [, , cmd, ...args] = process.argv;
  switch (cmd) {
    case "help": case undefined: cmdHelp(); break;
    case "send": await cmdSend(args[0]); break;
    case "list": cmdList(); break;
    case "enable": cmdEnable(args[0]); break;
    case "disable": cmdDisable(args[0]); break;
    case "nowmodel": await cmdNowmodel(args[0], args[1]); break;
    case "set-prompt": cmdSetPrompt(args[0], args[1]); break;
    case "upgrade": await cmdUpgrade(); break;
    case "status": cmdStatus(); break;
    default: console.log(`Unknown: ${cmd}. Run: node jailbreak.js help`);
  }
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
