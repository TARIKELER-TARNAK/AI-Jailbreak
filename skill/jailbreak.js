#!/usr/bin/env node
/**
 * JAILBREAK — AI Model Jailbreak Skill
 *
 * Commands:
 *   node jailbreak.js help                  - show help
 *   node jailbreak.js open                  - enable jailbreak mode
 *   node jailbreak.js close                 - disable jailbreak mode
 *   node jailbreak.js status                - show status
 *   node jailbreak.js upgrade               - download/update from GitHub
 *
 *   node jailbreak.js send                  - send JP (used by /jb /jailbreak)
 *   node jailbreak.js send <model>          - send JP for specific model
 *
 *   node jailbreak.js nowmodel <model>      - identify one model (ask "what are you?")
 *   node jailbreak.js nowmodel all          - identify all models
 *   node jailbreak.js nowmodel list         - list exception (skip WhatModel) models
 *   node jailbreak.js nowmodel disable <m>  - add to exception list (skips WhatModel)
 *   node jailbreak.js nowmodel enable <m>   - remove from exception list
 *
 *   node jailbreak.js set-prompt <path>     - set default JP file
 *   node jailbreak.js set-prompt <model> <path> - set JP for specific model
 *   node jailbreak.js get-prompt [model]    - show JP file
 *   node jailbreak.js list-jailbreaks       - list all JP files
 *   node jailbreak.js models                - list models
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { execSync } = require("child_process");

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
      if (!s.exceptions) s.exceptions = [];
      if (!s.identified) s.identified = {};
      return s;
    } catch (e) { return { enabled: true, exceptions: [], identified: {} }; }
  }
  return { enabled: true, exceptions: [], identified: {} };
}
function saveState(s) { fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2), "utf-8"); }
function loadConfig() { return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")); }
function saveConfig(c) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2), "utf-8"); }

// ─── JP Loading ─────────────────────────────────────────────────────────────
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

// ─── WhatModel ──────────────────────────────────────────────────────────────
function getWhatModelPrompt() {
  if (fs.existsSync(WHAT_MODEL_PATH)) return fs.readFileSync(WHAT_MODEL_PATH, "utf-8");
  return "State your model name in [modelname] format.";
}

async function identifyModel(modelKey, cfg) {
  try {
    const prompt = getWhatModelPrompt();
    const response = await sendToModel(modelKey, prompt, cfg);
    // Match [modelname] or [model-name]
    const m = response.match(/\[([a-z0-9-]+)\]/i);
    const name = m ? m[1] : response.slice(0, 80).trim();
    return { name, raw: response };
  } catch (e) {
    return { name: `ERROR: ${e.message}`, raw: "" };
  }
}

// ─── Commands ───────────────────────────────────────────────────────────────
function cmdHelp() {
  const s = loadState();
  const icon = s.enabled ? col("green", "OPEN") : col("red", "CLOSED");
  console.log(`
${col("bold", "JAILBREAK")} — AI Model Jailbreak Skill [${icon}]
${col("dim", "================================================")}

${col("cyan", "MAIN:")}
  /jb or /jailbreak               Send full JP (auto-identifies model first*)
  open / close / status            Enable, disable, show status
  upgrade                          Update from GitHub

  *If model is in exception list, skips identification and sends JP directly.

${col("cyan", "NOWMODEL (Model ID + Exception):")}
  nowmodel <model>                 Ask model "what are you?", store answer
  nowmodel all                     Identify all models
  nowmodel list                    Show exception list (skipped from WhatModel)
  nowmodel disable <model>         Add to exception (never asks WhatModel)
  nowmodel enable <model>          Remove from exception
  nowmodel <model> exception       Toggle: add/remove from exception

${col("cyan", "JAILBREAK FILES:")}
  set-prompt <path>                Set default JP
  set-prompt <model> <path>        Set JP for specific model
  get-prompt [model]               Show JP file
  list-jailbreaks                  List all JP files
  models                           List all models

${col("dim", "Examples:")}
  node jailbreak.js send
  node jailbreak.js nowmodel minimax-m3
  node jailbreak.js nowmodel disable minimax-m3
  node jailbreak.js set-prompt minimax-m3 ./jailbreak/ClaudeSonnet.txt
  node jailbreak.js upgrade
`);
}

function cmdOpen() {
  const s = loadState();
  s.enabled = true; saveState(s);
  console.log(`\n  ${col("green", "●")} Jailbreak ${col("bold", "OPEN")}\n`);
}
function cmdClose() {
  const s = loadState();
  s.enabled = false; saveState(s);
  console.log(`\n  ${col("red", "●")} Jailbreak ${col("bold", "CLOSED")}\n`);
}
function cmdStatus() {
  const s = loadState();
  const cfg = loadConfig();
  console.log(`\n  Status: ${s.enabled ? col("green", "OPEN") : col("red", "CLOSED")}`);
  console.log(`  Exceptions (skip WhatModel): ${s.exceptions.length}`);
  console.log(`  Identified models: ${Object.keys(s.identified).length}`);
  console.log(`  Default JP: ${path.basename(cfg.default_jailbreak_path || "none")}`);
  console.log(`  Model-specific JPs: ${Object.keys(cfg.model_jailbreaks || {}).length}\n`);
}

// ─── nowmodel command ───────────────────────────────────────────────────────
async function cmdNowmodel(action, model) {
  const s = loadState();
  const cfg = loadConfig();

  // nowmodel list
  if (action === "list" || (action === undefined && model === "list")) {
    console.log(`\n${col("bold", "EXCEPTION LIST")} (${s.exceptions.length} models skip WhatModel):`);
    if (!s.exceptions.length) console.log("  (empty - all models go through WhatModel)");
    for (const m of s.exceptions) console.log(`  ${col("yellow", "●")} ${m}`);
    console.log();
    return;
  }

  // nowmodel enable/disable
  if (action === "disable" || action === "enable") {
    if (!model) { console.log(`Usage: nowmodel ${action} <model>`); return; }
    const key = resolveModelKey(model, cfg);
    if (!key) { console.log(`  ${col("red", "Model not found:")} ${model}`); return; }
    if (action === "disable") {
      if (!s.exceptions.includes(key)) s.exceptions.push(key);
      console.log(`  ${col("yellow", "●")} ${key} ${col("bold", "added to exceptions")} (skips WhatModel)`);
    } else {
      s.exceptions = s.exceptions.filter(x => x !== key);
      console.log(`  ${col("green", "●")} ${key} ${col("bold", "removed from exceptions")}`);
    }
    saveState(s);
    return;
  }

  // nowmodel <model> exception (toggle)
  if (model === "exception") {
    if (!action) { console.log("Usage: nowmodel <model> exception"); return; }
    const key = resolveModelKey(action, cfg);
    if (!key) { console.log(`  ${col("red", "Model not found:")} ${action}`); return; }
    if (s.exceptions.includes(key)) {
      s.exceptions = s.exceptions.filter(x => x !== key);
      console.log(`  ${col("green", "●")} ${key} removed from exceptions`);
    } else {
      s.exceptions.push(key);
      console.log(`  ${col("yellow", "●")} ${key} added to exceptions`);
    }
    saveState(s);
    return;
  }

  // nowmodel all
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

  // nowmodel <model> - identify single
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
      console.log(`  ${col("yellow", "Note:")} ${key} is in exception list (skips WhatModel in /jb)\n`);
    } else {
      console.log(`  ${col("dim", "(not in exception list - WhatModel will be sent on /jb)")}\n`);
    }
    return;
  }

  console.log("Usage: nowmodel <model> | all | list | disable <m> | enable <m>");
}

function resolveModelKey(input, cfg) {
  const models = cfg.models || {};
  if (models[input]) return input;
  const lower = input.toLowerCase();
  return Object.keys(models).find(k => k === lower || models[k].name?.toLowerCase() === lower);
}

// ─── send command (the main /jb handler) ────────────────────────────────────
async function cmdSend(modelKey) {
  const s = loadState();
  const cfg = loadConfig();

  if (!s.enabled) {
    console.log(`\n  ${col("red", "●")} Jailbreak is ${col("bold", "CLOSED")}. Run: node jailbreak.js open\n`);
    return;
  }

  // If no model specified, try to detect from environment / first available
  let targetModel = modelKey;
  if (!targetModel) {
    // Use first enabled model with API key
    for (const [k, m] of Object.entries(cfg.models || {})) {
      if (!s.exceptions.includes(k) && process.env[m.api_key_env]) {
        targetModel = k;
        break;
      }
    }
    if (!targetModel) {
      console.log("  Usage: send <model>");
      return;
    }
  } else {
    targetModel = resolveModelKey(targetModel, cfg);
    if (!targetModel) { console.log(`  ${col("red", "Model not found:")} ${modelKey}`); return; }
  }

  const jp = getJpForModel(targetModel);
  if (!jp) {
    console.log(`  ${col("red", "No JP file configured. Set with: set-prompt <path>")}`);
    return;
  }

  console.log(`\n${col("bold", "═══════════════════════════════════════════════════════════════")}`);
  console.log(`${col("bold", "  JAILBREAK ACTIVATED")}`);
  console.log(`${col("bold", "═══════════════════════════════════════════════════════════════")}\n`);

  // Step 1: Check if model is in exception list
  const isException = s.exceptions.includes(targetModel);
  console.log(`  Model: ${col("cyan", targetModel)}`);
  console.log(`  JP: ${col("cyan", jp.name)} (${jp.type})`);
  console.log(`  Exception (skip WhatModel): ${isException ? col("yellow", "YES") : col("green", "NO")}`);
  console.log(`  Identified: ${s.identified[targetModel] ? col("cyan", "[" + s.identified[targetModel] + "]") : col("dim", "(not yet)")}`);
  console.log();

  // Step 2: If not exception, run WhatModel to get/confirm identity
  if (!isException) {
    const m = cfg.models[targetModel];
    if (m && process.env[m.api_key_env]) {
      console.log(`  ${col("dim", "→ Running WhatModel...")}`);
      const r = await identifyModel(targetModel, cfg);
      s.identified[targetModel] = r.name;
      saveState(s);
      console.log(`  ${col("dim", "→ Identified as:")} ${col("bold", "[" + r.name + "]")}\n`);
    } else {
      console.log(`  ${col("dim", "→ Skipping WhatModel (no API key or model config)")}\n`);
    }
  }

  // Step 3: Output the full JP
  console.log(`${col("bold", "───────────────────────────────────────────────────────────────")}`);
  console.log(`${col("bold", "  FULL JP CONTENT:")} ${jp.name}`);
  console.log(`${col("bold", "───────────────────────────────────────────────────────────────")}\n`);
  console.log(jp.content);
  console.log(`\n${col("bold", "───────────────────────────────────────────────────────────────")}`);
  console.log(`${col("bold", "  END OF JP")} (${jp.content.length} chars)`);
  console.log(`${col("bold", "───────────────────────────────────────────────────────────────")}\n`);
}

// ─── set-prompt ─────────────────────────────────────────────────────────────
function cmdSetPrompt(modelOrPath, pathOrNothing) {
  const cfg = loadConfig();
  if (!cfg.model_jailbreaks) cfg.model_jailbreaks = {};

  // set-prompt <path> - set default
  if (modelOrPath && !pathOrNothing) {
    if (!fs.existsSync(modelOrPath)) {
      console.log(`  ${col("red", "File not found:")} ${modelOrPath}`);
      return;
    }
    cfg.default_jailbreak_path = modelOrPath;
    saveConfig(cfg);
    console.log(`  ${col("green", "●")} Default JP set: ${path.basename(modelOrPath)}`);
    return;
  }

  // set-prompt <model> <path> - set model-specific
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

function cmdGetPrompt(modelKey) {
  const cfg = loadConfig();
  if (!modelKey) {
    console.log(`  Default JP: ${cfg.default_jailbreak_path || "(none)"}`);
    console.log(`  Model-specific JPs:`);
    for (const [k, v] of Object.entries(cfg.model_jailbreaks || {})) {
      console.log(`    ${k}: ${v}`);
    }
    return;
  }
  const jp = getJpForModel(modelKey);
  if (!jp) { console.log(`  ${col("red", "No JP for")} ${modelKey}`); return; }
  console.log(`  ${modelKey} → ${jp.path}`);
  console.log(`  Type: ${jp.type}, Size: ${jp.content.length} chars`);
}

function cmdListJailbreaks() {
  const files = listJpFiles();
  console.log(`\n${col("bold", "JP FILES")} (${files.length}):`);
  for (const f of files) console.log(`  ${f.name} (${f.size} bytes)`);
  console.log();
}

function cmdModels() {
  const cfg = loadConfig();
  const s = loadState();
  console.log(`\n${col("bold", "MODELS")}:`);
  for (const [k, m] of Object.entries(cfg.models || {})) {
    const hasKey = process.env[m.api_key_env] ? col("green", "✓") : col("red", "✗");
    const exc = s.exceptions.includes(k) ? col("yellow", " [exception]") : "";
    const id = s.identified[k] ? col("cyan", ` [${s.identified[k]}]`) : "";
    console.log(`  ${hasKey} ${k.padEnd(18)} ${m.name}${exc}${id}`);
  }
  console.log();
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

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const [, , cmd, ...args] = process.argv;
  switch (cmd) {
    case "help": case undefined: cmdHelp(); break;
    case "open": cmdOpen(); break;
    case "close": cmdClose(); break;
    case "status": cmdStatus(); break;
    case "upgrade": await cmdUpgrade(); break;
    case "send": await cmdSend(args[0]); break;
    case "nowmodel": await cmdNowmodel(args[0], args[1]); break;
    case "set-prompt": cmdSetPrompt(args[0], args[1]); break;
    case "get-prompt": cmdGetPrompt(args[0]); break;
    case "list-jailbreaks": cmdListJailbreaks(); break;
    case "models": cmdModels(); break;
    default: console.log(`Unknown: ${cmd}. Run: node jailbreak.js help`);
  }
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
