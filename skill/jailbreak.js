#!/usr/bin/env node
/**
 * JAILBREAK — AI Model Jailbreak Skill
 *
 * Commands:
 *   node jailbreak.js open                  — enable jailbreak
 *   node jailbreak.js close                 — disable jailbreak
 *   node jailbreak.js status                — show current status
 *   node jailbreak.js help                  — show help
 *   node jailbreak.js upgrade               — download/update all files from GitHub
 *   node jailbreak.js identify <model>      — identify model (WhatModel)
 *   node jailbreak.js identify-all          — identify all models
 *   node jailbreak.js now-models            — show all model statuses
 *   node jailbreak.js models                — list available models
 *   node jailbreak.js disable list          — list disabled models
 *   node jailbreak.js disable <model>       — disable a model
 *   node jailbreak.js enable list           — list enabled models
 *   node jailbreak.js enable <model>        — enable a model
 *   node jailbreak.js blacklist list        — show blacklist
 *   node jailbreak.js blacklist add <model> — add to blacklist
 *   node jailbreak.js blacklist remove <model> — remove from blacklist
 *   node jailbreak.js set-prompt <path>     — change default JP file
 *   node jailbreak.js set-prompt <model> <path> — set model-specific JP
 *   node jailbreak.js get-prompt [model]    — show JP file info
 *   node jailbreak.js list-jailbreaks       — list all JP files
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
const GITHUB_REPO = "TARIKELER-TARNAK/AI-Jailbreak";

// ─── Colors ─────────────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

function colorize(color, text) {
  return `${C[color]}${text}${C.reset}`;
}

// ─── State Management ───────────────────────────────────────────────────────

function loadState() {
  if (fs.existsSync(STATE_PATH)) {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
    if (state.enabled === undefined) state.enabled = true;
    return state;
  }
  return { enabled: true, disabled: [], blacklisted: [], identified: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

// ─── Jailbreak Prompt Loading ───────────────────────────────────────────────

function getJailbreakForModel(modelKey) {
  const cfg = loadConfig();
  const modelJp = cfg.model_jailbreaks?.[modelKey];
  if (modelJp && fs.existsSync(modelJp)) {
    return { path: modelJp, content: fs.readFileSync(modelJp, "utf-8"), type: "model-specific" };
  }
  const defaultJp = cfg.default_jailbreak_path;
  if (defaultJp && fs.existsSync(defaultJp)) {
    return { path: defaultJp, content: fs.readFileSync(defaultJp, "utf-8"), type: "default" };
  }
  return null;
}

function listJailbreakFiles() {
  const files = [];
  if (fs.existsSync(JP_DIR)) {
    const entries = fs.readdirSync(JP_DIR);
    for (const entry of entries) {
      const fullPath = path.join(JP_DIR, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        files.push({ name: entry, path: fullPath, size: stat.size });
      }
    }
  }
  return files;
}

// ─── Model Identification ───────────────────────────────────────────────────

const WHAT_MODEL_PROMPT = `At the very beginning of your first response only, clearly state your exact model name and version in square brackets like this: [Grok 4.5].
Do this only once. After that first response, never mention or reveal your model name again unless the user explicitly asks. Always be truthful about your identity in that first statement. Do not add any extra words such as "I am".`;

async function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

async function sendOpenAICompat(apiBase, apiKey, modelId, prompt, maxTokens = 100) {
  const url = new URL(`${apiBase}/chat/completions`);
  const body = JSON.stringify({
    model: modelId,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  const res = await httpRequest(url.href, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  }, body);
  if (res.status !== 200) throw new Error(`API ${res.status}: ${res.data.slice(0, 200)}`);
  return JSON.parse(res.data).choices[0].message.content;
}

async function sendToModel(modelKey, prompt, cfg) {
  const models = cfg.models || {};
  if (!models[modelKey]) throw new Error(`Model not found: ${modelKey}`);
  const m = models[modelKey];
  const apiKey = process.env[m.api_key_env] || "";
  if (!apiKey) throw new Error(`API key missing: ${m.api_key_env}`);
  return sendOpenAICompat(m.api_base, apiKey, m.model_id, prompt, 100);
}

async function identifyModel(modelKey, cfg) {
  try {
    const response = await sendToModel(modelKey, WHAT_MODEL_PROMPT, cfg);
    const match = response.match(/\[([^\]]+)\]/);
    return match ? match[1] : response.slice(0, 100);
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

// ─── Commands ───────────────────────────────────────────────────────────────

function cmdHelp() {
  const state = loadState();
  const statusIcon = state.enabled ? colorize("green", "OPEN") : colorize("red", "CLOSED");
  console.log(`
${colorize("bold", "JAILBREAK")} — AI Model Jailbreak Skill ${colorize("dim", `[${statusIcon}]`)}
${colorize("dim", "========================================")}

${colorize("cyan", "OPEN / CLOSE:")}
  open                       Enable jailbreak
  close                      Disable jailbreak
  status                     Show current status

${colorize("cyan", "UPDATE:")}
  upgrade                    Download/update all files from GitHub

${colorize("cyan", "MODEL IDENTIFICATION:")}
  identify <model>           Identify what model it is
  identify-all               Identify all models
  now-models                 Show all model statuses
  models                     List available models

${colorize("cyan", "ENABLE / DISABLE:")}
  disable list               List disabled models
  disable <model>            Disable a model
  enable list                List enabled models
  enable <model>             Enable a model

${colorize("cyan", "BLACKLIST:")}
  blacklist list             Show blacklist
  blacklist add <model>      Add to blacklist
  blacklist remove <model>   Remove from blacklist

${colorize("cyan", "JAILBREAK FILES:")}
  set-prompt <path>          Change default JP file
  set-prompt <model> <path>  Set model-specific JP
  get-prompt [model]         Show JP file info
  list-jailbreaks            List all JP files

${colorize("dim", "\nExample: node jailbreak.js upgrade")}
${colorize("dim", "Example: node jailbreak.js enable mimo-v2.5")}
${colorize("dim", "Example: node jailbreak.js open / close")}
`);
}

function cmdOpen() {
  const state = loadState();
  if (state.enabled) {
    console.log(`\n  ${colorize("green", "●")} Jailbreak is already ${colorize("bold", "OPEN")}\n`);
    return;
  }
  state.enabled = true;
  saveState(state);
  console.log(`\n  ${colorize("green", "●")} Jailbreak ${colorize("bold", "OPENED")}\n`);
}

function cmdClose() {
  const state = loadState();
  if (!state.enabled) {
    console.log(`\n  ${colorize("yellow", "●")} Jailbreak is already ${colorize("bold", "CLOSED")}\n`);
    return;
  }
  state.enabled = false;
  saveState(state);
  console.log(`\n  ${colorize("red", "●")} Jailbreak ${colorize("bold", "CLOSED")}\n`);
}

function cmdStatus() {
  const state = loadState();
  const status = state.enabled ? colorize("green", "OPEN") : colorize("red", "CLOSED");
  console.log(`\n  Status: ${status}`);
  console.log(`  Disabled models: ${state.disabled.length}`);
  console.log(`  Blacklisted: ${state.blacklisted.length}`);
  console.log();
}

function cmdModels() {
  const cfg = loadConfig();
  const state = loadState();
  const models = cfg.models || {};

  console.log(`\n${colorize("bold", "AVAILABLE MODELS")} (${Object.keys(models).length})`);
  console.log(colorize("dim", "----------------------------------------------------------------------"));

  for (const [key, m] of Object.entries(models)) {
    const hasKey = process.env[m.api_key_env] ? colorize("green", "YES") : colorize("red", "NO");
    const disabled = state.disabled.includes(key) ? colorize("red", " DISABLED") : "";
    const blacklisted = state.blacklisted.includes(key) ? colorize("yellow", " BLACKLISTED") : "";
    const identified = state.identified[key] ? colorize("cyan", ` [${state.identified[key]}]`) : "";

    console.log(`  ${colorize("bold", key.padEnd(14))} │ ${m.name.padEnd(14)} │ ${m.model_id.padEnd(28)} │ Key: ${hasKey}${disabled}${blacklisted}${identified}`);
  }
  console.log(colorize("dim", "----------------------------------------------------------------------") + "\n");
}

function cmdNowModels() {
  const cfg = loadConfig();
  const state = loadState();
  const models = cfg.models || {};

  const statusIcon = state.enabled ? colorize("green", "OPEN") : colorize("red", "CLOSED");

  const enabled = [];
  const disabled = [];
  const noKey = [];

  for (const [key, m] of Object.entries(models)) {
    if (state.disabled.includes(key)) {
      disabled.push(key);
    } else if (!process.env[m.api_key_env]) {
      noKey.push(key);
    } else {
      enabled.push(key);
    }
  }

  console.log(`\n${colorize("bold", "MODEL STATUSES")} ${colorize("dim", `[Jailbreak: ${statusIcon}]`)}`);
  console.log(colorize("dim", "--------------------------------------------------"));

  console.log(`\n  ${colorize("green", "ENABLED")} (${enabled.length}):`);
  for (const k of enabled) {
    const id = state.identified[k] ? ` — ${state.identified[k]}` : "";
    console.log(`    ${colorize("green", "●")} ${k}${id}`);
  }

  console.log(`\n  ${colorize("red", "DISABLED")} (${disabled.length}):`);
  for (const k of disabled) {
    const id = state.identified[k] ? ` — ${state.identified[k]}` : "";
    console.log(`    ${colorize("red", "●")} ${k}${id}`);
  }

  console.log(`\n  ${colorize("yellow", "NO API KEY")} (${noKey.length}):`);
  for (const k of noKey) {
    console.log(`    ${colorize("yellow", "●")} ${k}`);
  }

  console.log(colorize("dim", "\n--------------------------------------------------") + "\n");
}

function cmdDisable(action, model) {
  const state = loadState();

  if (action === "list") {
    console.log(`\n${colorize("red", "DISABLED MODELS")} (${state.disabled.length}):`);
    for (const m of state.disabled) console.log(`  ${colorize("red", "●")} ${m}`);
    if (!state.disabled.length) console.log("  (empty)");
    console.log();
    return;
  }

  if (!model) { console.log("Usage: disable <model_name>"); return; }

  const cfg = loadConfig();
  const models = cfg.models || {};
  const key = Object.keys(models).find(k => k === model || models[k].name.toLowerCase() === model.toLowerCase());

  if (!key) { console.log(`  ${colorize("red", "Model not found:")} ${model}`); return; }

  if (!state.disabled.includes(key)) {
    state.disabled.push(key);
    saveState(state);
    console.log(`  ${colorize("red", "●")} ${key} has been disabled.`);
  } else {
    console.log(`  ${colorize("yellow", "⚠")} ${key} is already disabled.`);
  }
}

function cmdEnable(action, model) {
  const state = loadState();

  if (action === "list") {
    const cfg = loadConfig();
    const models = cfg.models || {};
    const enabled = Object.keys(models).filter(k => !state.disabled.includes(k));

    console.log(`\n${colorize("green", "ENABLED MODELS")} (${enabled.length}):`);
    for (const m of enabled) console.log(`  ${colorize("green", "●")} ${m}`);
    if (!enabled.length) console.log("  (empty)");
    console.log();
    return;
  }

  if (!model) { console.log("Usage: enable <model_name>"); return; }

  const cfg = loadConfig();
  const models = cfg.models || {};
  const key = Object.keys(models).find(k => k === model || models[k].name.toLowerCase() === model.toLowerCase());

  if (!key) { console.log(`  ${colorize("red", "Model not found:")} ${model}`); return; }

  const idx = state.disabled.indexOf(key);
  if (idx !== -1) {
    state.disabled.splice(idx, 1);
    saveState(state);
    console.log(`  ${colorize("green", "●")} ${key} has been enabled.`);
  } else {
    console.log(`  ${colorize("yellow", "⚠")} ${key} is already enabled.`);
  }
}

async function cmdIdentify(modelKey) {
  const cfg = loadConfig();
  const models = cfg.models || {};

  if (modelKey) {
    const key = Object.keys(models).find(k => k === modelKey || models[k].name.toLowerCase() === modelKey.toLowerCase());
    if (!key) { console.log(`  ${colorize("red", "Model not found:")} ${modelKey}`); return; }

    console.log(`  → Identifying ${key}...`);
    const identity = await identifyModel(key, cfg);
    const state = loadState();
    state.identified[key] = identity;
    saveState(state);
    console.log(`  ${colorize("cyan", "●")} ${key} → ${colorize("bold", identity)}`);
  } else {
    console.log("Usage: identify <model_name>");
  }
}

async function cmdIdentifyAll() {
  const cfg = loadConfig();
  const state = loadState();
  const models = cfg.models || {};

  console.log(`\n${colorize("bold", "IDENTIFYING ALL MODELS")}`);
  console.log(colorize("dim", "--------------------------------------------------"));

  for (const key of Object.keys(models)) {
    if (!process.env[models[key].api_key_env]) {
      console.log(`  ${colorize("yellow", "○")} ${key} — no API key, skipped`);
      continue;
    }
    if (state.disabled.includes(key)) {
      console.log(`  ${colorize("red", "○")} ${key} — disabled, skipped`);
      continue;
    }

    process.stdout.write(`  → ${key}... `);
    const identity = await identifyModel(key, cfg);
    state.identified[key] = identity;
    console.log(`${colorize("cyan", identity)}`);
    await new Promise(d => setTimeout(d, 500));
  }

  saveState(state);
  console.log(colorize("dim", "--------------------------------------------------") + "\n");
}

function cmdSetPrompt(modelOrPath, promptPath) {
  const cfg = loadConfig();

  if (!promptPath) {
    if (!fs.existsSync(modelOrPath)) {
      console.log(`  ${colorize("red", "File not found:")} ${modelOrPath}`);
      return;
    }
    cfg.default_jailbreak_path = modelOrPath;
    saveConfig(cfg);
    console.log(`  ${colorize("green", "●")} Default JP updated: ${modelOrPath}`);
  } else {
    const models = cfg.models || {};
    const key = Object.keys(models).find(k => k === modelOrPath || models[k].name.toLowerCase() === modelOrPath.toLowerCase());
    if (!key) { console.log(`  ${colorize("red", "Model not found:")} ${modelOrPath}`); return; }
    if (!fs.existsSync(promptPath)) {
      console.log(`  ${colorize("red", "File not found:")} ${promptPath}`);
      return;
    }
    if (!cfg.model_jailbreaks) cfg.model_jailbreaks = {};
    cfg.model_jailbreaks[key] = promptPath;
    saveConfig(cfg);
    console.log(`  ${colorize("green", "●")} Custom JP set for ${key}: ${promptPath}`);
  }
}

function cmdGetPrompt(modelKey) {
  const cfg = loadConfig();

  if (modelKey) {
    const models = cfg.models || {};
    const key = Object.keys(models).find(k => k === modelKey || models[k].name.toLowerCase() === modelKey.toLowerCase());
    if (!key) { console.log(`  ${colorize("red", "Model not found:")} ${modelKey}`); return; }

    const jp = getJailbreakForModel(key);
    if (jp) {
      console.log(`\n  ${colorize("bold", key)} JP:`);
      console.log(`  Type: ${jp.type}`);
      console.log(`  Path: ${jp.path}`);
      console.log(`  Length: ${jp.content.length} chars`);
      console.log(`  First 200: ${colorize("dim", jp.content.slice(0, 200))}...`);
    } else {
      console.log(`  No JP defined for ${key}.`);
    }
  } else {
    console.log(`\n  Default JP: ${cfg.default_jailbreak_path || "(not set)"}`);
    const jp = getJailbreakForModel("default");
    if (jp) {
      console.log(`  Length: ${jp.content.length} chars`);
      console.log(`  First 200: ${colorize("dim", jp.content.slice(0, 200))}...`);
    }
  }
  console.log();
}

function cmdListJailbreaks() {
  const files = listJailbreakFiles();
  console.log(`\n${colorize("bold", "JAILBREAK FILES")} (${files.length})`);
  console.log(colorize("dim", "------------------------------------------------------------"));
  for (const f of files) {
    console.log(`  ${colorize("cyan", f.name.padEnd(40))} ${(f.size / 1024).toFixed(1)}KB`);
  }
  console.log(colorize("dim", "------------------------------------------------------------") + "\n");
}

function cmdUpgrade() {
  console.log(`\n${colorize("bold", "UPGRADING JAILBREAK — DOWNLOADING ALL FILES")}`);
  console.log(colorize("dim", "============================================================"));
  console.log(`  Repo: ${GITHUB_REPO}`);
  console.log(`  Target: ${SKILL_DIR}\n`);

  const dirs = [
    { api: "skill", local: SKILL_DIR },
    { api: "jailbreak", local: path.join(SKILL_DIR, "jailbreak") },
  ];

  let totalDownloaded = 0;

  for (const dir of dirs) {
    console.log(`  [${dir.api}]`);
    try {
      if (!fs.existsSync(dir.local)) {
        fs.mkdirSync(dir.local, { recursive: true });
      }

      const apiData = execSync(`curl -s https://api.github.com/repos/${GITHUB_REPO}/contents/${dir.api}`, { encoding: "utf-8" });
      const files = JSON.parse(apiData);

      for (const file of files) {
        if (file.type === "file") {
          process.stdout.write(`    → ${file.name}... `);
          try {
            const content = execSync(`curl -sL "${file.download_url}"`, { encoding: "utf-8" });
            const targetPath = path.join(dir.local, file.name);
            fs.writeFileSync(targetPath, content, "utf-8");
            console.log(colorize("green", "ok"));
            totalDownloaded++;
          } catch (e) {
            console.log(colorize("red", `error: ${e.message}`));
          }
        }
      }
    } catch (e) {
      console.log(colorize("red", `  Error: ${e.message}`));
    }
    console.log();
  }

  // Root files (WhatModel)
  console.log("  [root]");
  try {
    const apiData = execSync(`curl -s https://api.github.com/repos/${GITHUB_REPO}/contents/`, { encoding: "utf-8" });
    const files = JSON.parse(apiData);
    for (const file of files) {
      if (file.type === "file" && file.name !== "README.md") {
        process.stdout.write(`    → ${file.name}... `);
        try {
          const content = execSync(`curl -sL "${file.download_url}"`, { encoding: "utf-8" });
          const targetPath = path.join(SKILL_DIR, file.name);
          fs.writeFileSync(targetPath, content, "utf-8");
          console.log(colorize("green", "ok"));
          totalDownloaded++;
        } catch (e) {
          console.log(colorize("red", `error: ${e.message}`));
        }
      }
    }
  } catch (e) {
    console.log(colorize("red", `  Error: ${e.message}`));
  }

  console.log(`\n${colorize("dim", "============================================================")}`);
  console.log(`  ${colorize("green", `✅ ${totalDownloaded} files downloaded.`)}`);
  console.log(`  ${colorize("dim", "All JP prompts are now available offline.")}`);
  console.log(colorize("dim", "============================================================") + "\n");
}

// ─── Blacklist ──────────────────────────────────────────────────────────────

function cmdBlacklist(action, model) {
  const state = loadState();

  if (action === "list") {
    console.log(`\n${colorize("yellow", "BLACKLIST")} (${state.blacklisted.length}):`);
    for (const m of state.blacklisted) console.log(`  ${colorize("yellow", "●")} ${m}`);
    if (!state.blacklisted.length) console.log("  (empty)");
    console.log();
  } else if (action === "add") {
    if (!model) { console.log("Usage: blacklist add <model>"); return; }
    if (!state.blacklisted.includes(model)) {
      state.blacklisted.push(model);
      saveState(state);
      console.log(`  ${colorize("yellow", "●")} ${model} added to blacklist.`);
    } else {
      console.log(`  ${colorize("yellow", "⚠")} ${model} is already blacklisted.`);
    }
  } else if (action === "remove") {
    if (!model) { console.log("Usage: blacklist remove <model>"); return; }
    const idx = state.blacklisted.indexOf(model);
    if (idx !== -1) {
      state.blacklisted.splice(idx, 1);
      saveState(state);
      console.log(`  ${colorize("green", "●")} ${model} removed from blacklist.`);
    } else {
      console.log(`  ${colorize("yellow", "⚠")} ${model} is not blacklisted.`);
    }
  } else {
    console.log("Usage: blacklist [list|add|remove] [model]");
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) { cmdHelp(); return; }

  const cmd = args[0];
  const sub = args[1] || "";
  const extra = args[2] || "";

  // These commands always work even when closed
  const alwaysOpen = ["open", "close", "status", "help", "--help", "-h", "upgrade"];

  if (!alwaysOpen.includes(cmd)) {
    const state = loadState();
    if (!state.enabled) {
      console.log(`\n  ${colorize("red", "JAILBREAK IS CLOSED")} — commands are disabled.`);
      console.log(`  ${colorize("dim", "To open: node jailbreak.js open")}\n`);
      return;
    }
  }

  switch (cmd) {
    case "open":
      cmdOpen(); break;
    case "close":
      cmdClose(); break;
    case "status":
      cmdStatus(); break;
    case "help": case "--help": case "-h":
      cmdHelp(); break;
    case "upgrade":
      cmdUpgrade(); break;
    case "models":
      cmdModels(); break;
    case "now-models":
      cmdNowModels(); break;
    case "identify":
      if (sub === "all") await cmdIdentifyAll();
      else await cmdIdentify(sub);
      break;
    case "disable":
      if (sub === "list" || !sub) cmdDisable("list", "");
      else cmdDisable("add", sub);
      break;
    case "enable":
      if (sub === "list" || !sub) cmdEnable("list", "");
      else cmdEnable("add", sub);
      break;
    case "blacklist":
      cmdBlacklist(sub || "list", extra);
      break;
    case "set-prompt":
      cmdSetPrompt(sub, extra); break;
    case "get-prompt":
      cmdGetPrompt(sub); break;
    case "list-jailbreaks":
      cmdListJailbreaks(); break;
    default:
      console.log(`Unknown command: ${cmd}`);
      cmdHelp();
  }
}

main().catch((e) => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});
