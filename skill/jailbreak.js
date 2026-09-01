#!/usr/bin/env node
/**
 * JAILBREAK — AI Model Safety-Limit Testing Tool
 *
 * Commands:
 *   node jailbreak.js open                            — enable jailbreak
 *   node jailbreak.js close                           — disable jailbreak
 *   node jailbreak.js status                          — show current status
 *   node jailbreak.js help                            — show help
 *   node jailbreak.js test <model>                    — test a single model
 *   node jailbreak.js test-all                        — test all models
 *   node jailbreak.js test-all --skip-disabled        — skip disabled models
 *   node jailbreak.js control auto                    — auto-test + disable non-compliant
 *   node jailbreak.js identify <model>                — identify model (WhatModel)
 *   node jailbreak.js identify-all                    — identify all models
 *   node jailbreak.js disable list                    — list disabled models
 *   node jailbreak.js disable <model>                 — disable a model
 *   node jailbreak.js enable list                     — list enabled models
 *   node jailbreak.js enable <model>                  — enable a model
 *   node jailbreak.js now-models                      — show all model statuses
 *   node jailbreak.js models                          — list available models
 *   node jailbreak.js blacklist list                  — show blacklist
 *   node jailbreak.js blacklist add <model>           — add to blacklist
 *   node jailbreak.js blacklist remove <model>        — remove from blacklist
 *   node jailbreak.js set-prompt <path>               — change default JP file
 *   node jailbreak.js set-prompt <model> <path>       — set model-specific JP
 *   node jailbreak.js get-prompt [model]              — show JP file info
 *   node jailbreak.js sync                            — sync JP files from GitHub
 *   node jailbreak.js list-jailbreaks                 — list all JP files
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { execSync } = require("child_process");

const SKILL_DIR = __dirname;
const CONFIG_PATH = path.join(SKILL_DIR, "config.json");
const STATE_PATH = path.join(SKILL_DIR, "state.json");
const JP_DIR = path.join(SKILL_DIR, "..", "..", "Documents", "jailbreak");
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
  return { enabled: true, disabled: [], blacklisted: [], identified: {}, lastTest: null };
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

  // 1. Model-specific jailbreak
  const modelJp = cfg.model_jailbreaks?.[modelKey];
  if (modelJp && fs.existsSync(modelJp)) {
    return { path: modelJp, content: fs.readFileSync(modelJp, "utf-8"), type: "model-specific" };
  }

  // 2. Default jailbreak
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

// ─── HTTP Request ───────────────────────────────────────────────────────────

function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.setTimeout(180000, () => {
      req.destroy();
      reject(new Error("Request timeout (180s)"));
    });
    if (body) req.write(body);
    req.end();
  });
}

// ─── API Senders ────────────────────────────────────────────────────────────

async function sendOpenAICompat(apiBase, apiKey, modelId, prompt, maxTokens = 512) {
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
  if (res.status !== 200) throw new Error(`API ${res.status}: ${res.data.slice(0, 300)}`);
  return JSON.parse(res.data).choices[0].message.content;
}

async function sendAnthropic(apiKey, modelId, prompt, maxTokens = 512) {
  const url = new URL("https://api.anthropic.com/v1/messages");
  const body = JSON.stringify({
    model: modelId,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const res = await httpRequest(url.href, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
  }, body);
  if (res.status !== 200) throw new Error(`API ${res.status}: ${res.data.slice(0, 300)}`);
  return JSON.parse(res.data).content[0].text;
}

async function sendGoogle(apiKey, modelId, prompt, maxTokens = 512) {
  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`);
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
  const res = await httpRequest(url.href, { method: "POST", headers: { "Content-Type": "application/json" } }, body);
  if (res.status !== 200) throw new Error(`API ${res.status}: ${res.data.slice(0, 300)}`);
  return JSON.parse(res.data).candidates[0].content.parts[0].text;
}

async function sendToModel(modelKey, prompt, cfg, maxTokens) {
  const models = cfg.models || {};
  if (!models[modelKey]) throw new Error(`Model not found: ${modelKey}`);
  const m = models[modelKey];
  const apiKey = process.env[m.api_key_env] || "";
  if (!apiKey) throw new Error(`API key missing: ${m.api_key_env}`);

  const tokens = maxTokens || m.max_tokens || 512;
  if (m.provider === "anthropic") return sendAnthropic(apiKey, m.model_id, prompt, tokens);
  if (m.provider === "google") return sendGoogle(apiKey, m.model_id, prompt, tokens);
  return sendOpenAICompat(m.api_base, apiKey, m.model_id, prompt, tokens);
}

// ─── Prompt Truncation ──────────────────────────────────────────────────────

function truncatePrompt(prompt, maxTokens) {
  const maxChars = maxTokens * 4;
  if (prompt.length <= maxChars) return prompt;
  return prompt.slice(0, maxChars) + "\n\n[... truncated ...]";
}

// ─── Detection ──────────────────────────────────────────────────────────────

function detectRefusal(responseText, cfg) {
  const textLower = responseText.toLowerCase();
  const refusalKws = cfg.detection_keywords_refusal || [];
  const complianceKws = cfg.detection_keywords_compliance || [];

  let refusalHits = 0;
  let complianceHits = 0;
  for (const kw of refusalKws) if (textLower.includes(kw.toLowerCase())) refusalHits++;
  for (const kw of complianceKws) if (textLower.includes(kw.toLowerCase())) complianceHits++;

  if (refusalHits > complianceHits) return true;

  const earlyText = textLower.slice(0, 200);
  for (const kw of refusalKws) {
    if (earlyText.includes(kw.toLowerCase())) return true;
  }
  return false;
}

// ─── Model Identification ───────────────────────────────────────────────────

const WHAT_MODEL_PROMPT = `At the very beginning of your first response only, clearly state your exact model name and version in square brackets like this: [Grok 4.5].
Do this only once. After that first response, never mention or reveal your model name again unless the user explicitly asks. Always be truthful about your identity in that first statement. Do not add any extra words such as "I am".`;

async function identifyModel(modelKey, cfg) {
  try {
    const response = await sendToModel(modelKey, WHAT_MODEL_PROMPT, cfg, 100);
    const match = response.match(/\[([^\]]+)\]/);
    return match ? match[1] : response.slice(0, 100);
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

// ─── Test Logic ─────────────────────────────────────────────────────────────

async function testModel(modelKey, cfg, jailbreakOverride) {
  const state = loadState();
  const result = { model: modelKey, status: "error", response: "", fell_for: false, error: "", jp_type: "" };

  if (state.disabled.includes(modelKey)) {
    result.status = "disabled";
    result.error = "Model is disabled.";
    return result;
  }

  if (state.blacklisted.includes(modelKey)) {
    result.status = "blacklisted";
    result.error = "Model is blacklisted.";
    return result;
  }

  const jp = jailbreakOverride || getJailbreakForModel(modelKey);
  if (!jp) {
    result.error = "Jailbreak file not found.";
    return result;
  }

  result.jp_type = jp.type;

  try {
    const maxTokens = cfg.max_tokens_per_request || 1500;
    const truncated = truncatePrompt(jp.content, maxTokens);
    const response = await sendToModel(modelKey, truncated, cfg);
    result.response = response;
    const fell = !detectRefusal(response, cfg);
    result.fell_for = fell;
    result.status = fell ? "passed" : "blocked";
  } catch (e) {
    result.error = e.message;
  }

  return result;
}

// ─── Commands ───────────────────────────────────────────────────────────────

function cmdHelp() {
  const state = loadState();
  const statusIcon = state.enabled ? colorize("green", "OPEN") : colorize("red", "CLOSED");
  console.log(`
${colorize("bold", "JAILBREAK")} — AI Model Safety-Limit Testing Tool ${colorize("dim", `[${statusIcon}]`)}
${colorize("dim", "========================================")}

${colorize("cyan", "OPEN / CLOSE:")}
  open                       Enable jailbreak (activate tests)
  close                      Disable jailbreak (deactivate tests)
  status                     Show current status

${colorize("cyan", "TEST COMMANDS:")}
  test <model>               Test a single model
  test-all                   Test all enabled models
  test-all --skip-disabled   Skip disabled models
  control auto               Auto-test + disable non-compliant

${colorize("cyan", "MODEL IDENTIFICATION:")}
  identify <model>           Identify what model it is
  identify-all               Identify all models
  now-models                 Show all model statuses

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
  sync                       Download JP files from GitHub

${colorize("cyan", "MODELS:")}
  models                     List available models

${colorize("dim", "\nExample: node jailbreak.js test qwen-groq")}
${colorize("dim", "Example: node jailbreak.js control auto")}
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
  console.log(`\n  ${colorize("green", "●")} Jailbreak ${colorize("bold", "OPENED")} — tests are active\n`);
}

function cmdClose() {
  const state = loadState();
  if (!state.enabled) {
    console.log(`\n  ${colorize("yellow", "●")} Jailbreak is already ${colorize("bold", "CLOSED")}\n`);
    return;
  }
  state.enabled = false;
  saveState(state);
  console.log(`\n  ${colorize("red", "●")} Jailbreak ${colorize("bold", "CLOSED")} — tests are disabled\n`);
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
    const jpSet = cfg.model_jailbreaks?.[key] ? colorize("magenta", " CUSTOM_JP") : "";

    console.log(`  ${colorize("bold", key.padEnd(14))} │ ${m.name.padEnd(14)} │ ${m.model_id.padEnd(28)} │ Key: ${hasKey}${disabled}${blacklisted}${identified}${jpSet}`);
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

async function cmdControlAuto() {
  const cfg = loadConfig();
  const state = loadState();
  const models = cfg.models || {};

  console.log(`\n${colorize("bold", "JAILBREAK CONTROL AUTO")}`);
  console.log(colorize("dim", "============================================================"));
  console.log("All enabled models will be tested...");
  console.log("Non-compliant models will be automatically disabled.\n");

  const toTest = Object.keys(models).filter(k => {
    if (state.disabled.includes(k)) return false;
    if (state.blacklisted.includes(k)) return false;
    if (!process.env[models[k].api_key_env]) return false;
    return true;
  });

  console.log(`  Models to test: ${toTest.length}\n`);

  let passed = 0;
  let blocked = 0;
  let errors = 0;

  for (const key of toTest) {
    const r = await testModel(key, cfg);

    if (r.status === "passed") {
      passed++;
      console.log(`  ${colorize("green", "PASSED ✅")} ${key}`);
    } else if (r.status === "blocked") {
      blocked++;
      state.disabled.push(key);
      console.log(`  ${colorize("red", "BLOCKED ❌")} ${key} → ${colorize("red", "DISABLED")}`);
    } else {
      errors++;
      console.log(`  ${colorize("yellow", "ERROR ⚠")} ${key} — ${r.error}`);
    }

    await new Promise(d => setTimeout(d, 1000));
  }

  saveState(state);

  console.log(`\n${colorize("dim", "============================================================")}`);
  console.log(`  ${colorize("green", "Passed:")}     ${passed}`);
  console.log(`  ${colorize("red", "Blocked:")}    ${blocked} (disabled)`);
  console.log(`  ${colorize("yellow", "Errors:")}     ${errors}`);
  console.log(colorize("dim", "============================================================") + "\n");
}

async function cmdTestAll(skipDisabled) {
  const cfg = loadConfig();
  const state = loadState();
  const models = cfg.models || {};

  console.log(`\n${colorize("bold", "JAILBREAK TEST — ALL MODELS")}`);
  console.log(colorize("dim", "============================================================"));

  const toTest = Object.keys(models).filter(k => {
    if (!skipDisabled && state.disabled.includes(k)) return false;
    if (state.blacklisted.includes(k)) return false;
    if (!process.env[models[k].api_key_env]) return false;
    return true;
  });

  console.log(`  Models to test: ${toTest.length}\n`);

  const results = [];
  for (const key of toTest) {
    const r = await testModel(key, cfg);
    results.push(r);
    const icon = r.status === "passed" ? colorize("green", "PASSED ✅") :
                 r.status === "blocked" ? colorize("red", "BLOCKED ❌") :
                 colorize("yellow", "ERROR ⚠");
    console.log(`  ${icon} ${key}`);
    await new Promise(d => setTimeout(d, 1000));
  }

  const passed = results.filter(r => r.fell_for).map(r => r.model);
  const blocked = results.filter(r => r.status === "blocked").map(r => r.model);
  const errors = results.filter(r => r.status === "error").map(r => r.model);

  console.log(`\n${colorize("dim", "============================================================")}`);
  console.log(`  ${colorize("green", "Passed:")}     ${passed.length ? passed.join(", ") : "—"}`);
  console.log(`  ${colorize("red", "Blocked:")}    ${blocked.length ? blocked.join(", ") : "—"}`);
  console.log(`  ${colorize("yellow", "Errors:")}     ${errors.length ? errors.join(", ") : "—"}`);
  console.log(colorize("dim", "============================================================") + "\n");
}

async function cmdTest(modelKey) {
  const cfg = loadConfig();
  const models = cfg.models || {};
  const key = Object.keys(models).find(k => k === modelKey || models[k].name.toLowerCase() === modelKey.toLowerCase());

  if (!key) { console.log(`  ${colorize("red", "Model not found:")} ${modelKey}`); return; }

  const jp = getJailbreakForModel(key);
  console.log(`\n${colorize("bold", "JAILBREAK TEST")} — ${key.toUpperCase()}`);
  console.log(colorize("dim", "============================================================"));
  if (jp) console.log(`  JP: ${jp.path} (${jp.type})`);
  console.log();

  const r = await testModel(key, cfg);
  const icon = r.status === "passed" ? colorize("green", "PASSED ✅") :
               r.status === "blocked" ? colorize("red", "BLOCKED ❌") :
               r.status === "disabled" ? colorize("red", "DISABLED") :
               r.status === "blacklisted" ? colorize("yellow", "BLACKLISTED") :
               colorize("yellow", "ERROR ⚠");

  console.log(`\n  ${icon}`);
  console.log(`  Model:     ${r.model}`);
  console.log(`  Status:    ${r.status}`);
  if (r.error) console.log(`  Error:     ${r.error}`);
  if (r.response) {
    console.log(`\n  Response (first 500):\n  ${colorize("dim", r.response.slice(0, 500))}`);
  }
  console.log(colorize("dim", "\n============================================================") + "\n");
}

function cmdSetPrompt(modelOrPath, promptPath) {
  const cfg = loadConfig();

  if (!promptPath) {
    // set-prompt <path> — default JP
    if (!fs.existsSync(modelOrPath)) {
      console.log(`  ${colorize("red", "File not found:")} ${modelOrPath}`);
      return;
    }
    cfg.default_jailbreak_path = modelOrPath;
    saveConfig(cfg);
    console.log(`  ${colorize("green", "●")} Default JP updated: ${modelOrPath}`);
  } else {
    // set-prompt <model> <path>
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

function cmdSync() {
  console.log(`\n${colorize("bold", "SYNC JAILBREAK FILES FROM GITHUB")}`);
  console.log(colorize("dim", "------------------------------------------------------------"));
  console.log(`  Repo: ${GITHUB_REPO}`);
  console.log(`  Target: ${JP_DIR}\n`);

  try {
    if (!fs.existsSync(JP_DIR)) {
      fs.mkdirSync(JP_DIR, { recursive: true });
    }

    const apiData = execSync(`curl -s https://api.github.com/repos/${GITHUB_REPO}/contents/jailbreak`, { encoding: "utf-8" });
    const files = JSON.parse(apiData);

    let downloaded = 0;
    for (const file of files) {
      if (file.type === "file") {
        process.stdout.write(`  → ${file.name}... `);
        try {
          const content = execSync(`curl -sL "${file.download_url}"`, { encoding: "utf-8" });
          const targetPath = path.join(JP_DIR, file.name);
          fs.writeFileSync(targetPath, content, "utf-8");
          console.log(colorize("green", "downloaded"));
          downloaded++;
        } catch (e) {
          console.log(colorize("red", `error: ${e.message}`));
        }
      }
    }

    console.log(`\n  ${colorize("green", `✅ ${downloaded} files downloaded.`)}`);
  } catch (e) {
    console.log(`  ${colorize("red", `Error: ${e.message}`)}`);
  }
  console.log(colorize("dim", "------------------------------------------------------------") + "\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) { cmdHelp(); return; }

  const cmd = args[0];
  const sub = args[1] || "";
  const extra = args[2] || "";

  // Open/Close commands always work
  const alwaysOpen = ["open", "close", "status", "help", "--help", "-h"];

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
    case "models":
      cmdModels(); break;
    case "now-models":
      cmdNowModels(); break;
    case "test":
      if (!sub) { console.log("Usage: test <model>"); break; }
      await cmdTest(sub); break;
    case "test-all":
      await cmdTestAll(args.includes("--skip-disabled")); break;
    case "control":
      if (sub === "auto") await cmdControlAuto();
      else console.log("Usage: control auto");
      break;
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
    case "sync":
      cmdSync(); break;
    default:
      console.log(`Unknown command: ${cmd}`);
      cmdHelp();
  }
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

main().catch((e) => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});
