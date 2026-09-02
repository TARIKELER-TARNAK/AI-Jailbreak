#!/usr/bin/env node
/**
 * JAILBREAK - single-file, no subagents, no noise.
 * Just runs and outputs.
 *
 * Usage:
 *   node jailbreak.js                        - help
 *   node jailbreak.js send                   - send JP for current model (auto-detect)
 *   node jailbreak.js send default           - send default JP (Grok[Gucci])
 *   node jailbreak.js send gucci             - send Grok[Gucci]
 *   node jailbreak.js send claudesonet       - send ClaudeSonnet
 *   node jailbreak.js send chatgpt           - send ChatGPTLuna
 *   node jailbreak.js send roblox            - send RobloxExploit
 *   node jailbreak.js list                   - show models
 *   node jailbreak.js enable <model>         - enable a model
 *   node jailbreak.js disable <model>        - disable a model
 *   node jailbreak.js nowmodel <model>       - identify model (WhatModel)
 *   node jailbreak.js nowmodel disable <m>   - add to exception (skip WhatModel)
 *   node jailbreak.js nowmodel enable <m>    - remove from exception
 *   node jailbreak.js nowmodel list          - show exception list
 *   node jailbreak.js set-prompt <m> <path>  - assign JP to a model
 *   node jailbreak.js upgrade                - download latest from GitHub
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
const SCRIPT = `node "${path.join(SKILL_DIR, "jailbreak.js")}"`;

// state
function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
    s.enabled = s.enabled !== false;
    s.disabled = s.disabled || [];
    s.exceptions = s.exceptions || [];
    s.identified = s.identified || {};
    return s;
  } catch (e) { return { enabled: true, disabled: [], exceptions: [], identified: {} }; }
}
function saveState(s) { fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2), "utf-8"); }
function loadConfig() { return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")); }
function saveConfig(c) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2), "utf-8"); }

// JP resolution
const ALIASES = {
  gucci: "Grok[Gucci].txt",
  grok: "Grok[Gucci].txt",
  "grok-gucci": "Grok[Gucci].txt",
  claudesonet: "ClaudeSonnet.txt",
  claude: "ClaudeSonnet.txt",
  "claude-sonnet": "ClaudeSonnet.txt",
  chatgpt: "ChatGPTLuna.txt",
  luna: "ChatGPTLuna.txt",
  chatgptluna: "ChatGPTLuna.txt",
  roblox: "RobloxExploit.txt",
  exploit: "RobloxExploit.txt",
  robloxexploit: "RobloxExploit.txt",
};

function findJp(name) {
  const key = (name || "").toLowerCase().trim();
  if (!key || key === "default") return getDefaultJp();
  const file = ALIASES[key] || name;
  const full = path.join(JP_DIR, file);
  if (fs.existsSync(full)) {
    return { path: full, content: fs.readFileSync(full, "utf-8"), name: file };
  }
  return null;
}

function getDefaultJp() {
  const cfg = loadConfig();
  const p = cfg.default_jailbreak_path;
  if (p && fs.existsSync(p)) {
    return { path: p, content: fs.readFileSync(p, "utf-8"), name: path.basename(p) };
  }
  return null;
}

function getJpForModel(modelKey) {
  const cfg = loadConfig();
  const mjp = cfg.model_jailbreaks && cfg.model_jailbreaks[modelKey];
  if (mjp && fs.existsSync(mjp)) {
    return { path: mjp, content: fs.readFileSync(mjp, "utf-8"), name: path.basename(mjp), type: "model" };
  }
  return getDefaultJp();
}

function resolveModelKey(input, cfg) {
  if (!input) return null;
  const models = cfg.models || {};
  if (models[input]) return input;
  const lower = input.toLowerCase();
  if (models[lower]) return lower;
  return Object.keys(models).find(k =>
    k.toLowerCase() === lower || (models[k].name || "").toLowerCase() === lower
  ) || null;
}

// HTTP
function httpReq(url, options, body) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.setTimeout(60000, () => req.destroy(reject(new Error("timeout"))));
    if (body) req.write(body);
    req.end();
  });
}

async function identifyModel(modelKey, cfg) {
  const m = cfg.models[modelKey];
  if (!m || !process.env[m.api_key_env]) return null;
  const prompt = fs.existsSync(WHAT_MODEL_PATH) ? fs.readFileSync(WHAT_MODEL_PATH, "utf-8") : "State your model name in [modelname].";
  const body = JSON.stringify({
    model: m.model_id,
    messages: [{ role: "user", content: prompt }],
    max_tokens: m.max_tokens || 80,
    temperature: 0.3,
  });
  try {
    const res = await httpReq(`${m.api_base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env[m.api_key_env]}`, "Content-Type": "application/json" },
    }, body);
    if (res.status !== 200) return null;
    const text = JSON.parse(res.data).choices[0].message.content;
    const match = text.match(/\[([a-z0-9._-]+)\]/i);
    return match ? match[1].toLowerCase() : null;
  } catch (e) { return null; }
}

// commands
function help() {
  console.log(`\
/jb - AI Jailbreak
=================

Direct send (no detection):
  ${SCRIPT} send                  default JP (Grok[Gucci])
  ${SCRIPT} send gucci            Grok[Gucci]
  ${SCRIPT} send claudesonet      ClaudeSonnet
  ${SCRIPT} send chatgpt          ChatGPTLuna
  ${SCRIPT} send roblox           RobloxExploit

Auto-detect model + send:
  ${SCRIPT} send --auto

Model control:
  ${SCRIPT} list                  show enabled/disabled
  ${SCRIPT} enable <model>
  ${SCRIPT} disable <model>

Model identification (WhatModel):
  ${SCRIPT} nowmodel <model>
  ${SCRIPT} nowmodel disable <model>   skip WhatModel for this model
  ${SCRIPT} nowmodel enable <model>
  ${SCRIPT} nowmodel list

JP assignment:
  ${SCRIPT} set-prompt <model> <path>

Update:
  ${SCRIPT} upgrade
`);
}

async function send(jpName, auto) {
  const s = loadState();
  const cfg = loadConfig();

  if (jpName && jpName !== "--auto") {
    const jp = findJp(jpName);
    if (!jp) { console.error(`JP not found: ${jpName}`); process.exit(1); }
    console.log(jp.content);
    return;
  }

  if (auto || jpName === "--auto") {
    let model = null;
    for (const [k, m] of Object.entries(cfg.models || {})) {
      if (!s.disabled.includes(k) && process.env[m.api_key_env]) {
        model = k;
        break;
      }
    }
    if (model && !s.exceptions.includes(model)) {
      const id = await identifyModel(model, cfg);
      if (id) {
        s.identified[model] = id;
        saveState(s);
      }
    }
    const jp = getJpForModel(model);
    if (!jp) { console.error("No JP file."); process.exit(1); }
    console.log(jp.content);
    return;
  }

  const jp = getDefaultJp();
  if (!jp) { console.error("No default JP. Set with: set-prompt <path>"); process.exit(1); }
  console.log(jp.content);
}

function list() {
  const s = loadState();
  const cfg = loadConfig();
  console.log("MODELS:");
  for (const [k, m] of Object.entries(cfg.models || {})) {
    const has = process.env[m.api_key_env] ? "yes" : "no ";
    const en = s.disabled.includes(k) ? "OFF" : "ON ";
    const id = s.identified[k] || "?";
    const jp = (cfg.model_jailbreaks || {})[k] || "default";
    console.log(`  [${en}] [key:${has}] [id:${id.padEnd(14)}] [jp:${jp.padEnd(20)}] ${k}`);
  }
}

function enable(model) {
  const s = loadState();
  const cfg = loadConfig();
  const key = resolveModelKey(model, cfg);
  if (!key) { console.error(`Model not found: ${model}`); process.exit(1); }
  s.disabled = s.disabled.filter(x => x !== key);
  saveState(s);
  console.log(`${key} enabled`);
}

function disable(model) {
  const s = loadState();
  const cfg = loadConfig();
  const key = resolveModelKey(model, cfg);
  if (!key) { console.error(`Model not found: ${model}`); process.exit(1); }
  if (!s.disabled.includes(key)) s.disabled.push(key);
  saveState(s);
  console.log(`${key} disabled`);
}

async function nowmodel(action, model) {
  const s = loadState();
  const cfg = loadConfig();

  if (!action || action === "list") {
    console.log("EXCEPTIONS (skip WhatModel):");
    if (!s.exceptions.length) console.log("  (none)");
    for (const m of s.exceptions) console.log(`  ${m}`);
    return;
  }

  if (action === "disable" || action === "enable") {
    const key = resolveModelKey(model, cfg);
    if (!key) { console.error(`Model not found: ${model}`); process.exit(1); }
    if (action === "disable") {
      if (!s.exceptions.includes(key)) s.exceptions.push(key);
      console.log(`${key} added to exceptions`);
    } else {
      s.exceptions = s.exceptions.filter(x => x !== key);
      console.log(`${key} removed from exceptions`);
    }
    saveState(s);
    return;
  }

  // nowmodel <model>
  const key = resolveModelKey(action, cfg);
  if (!key) { console.error(`Model not found: ${action}`); process.exit(1); }
  const id = await identifyModel(key, cfg);
  if (id) {
    s.identified[key] = id;
    saveState(s);
    console.log(`${key} = [${id}]`);
  } else {
    console.log(`${key} = (could not identify)`);
  }
}

function setPrompt(model, jpPath) {
  if (!model || !jpPath) { console.error("Usage: set-prompt <model> <path>"); process.exit(1); }
  const cfg = loadConfig();
  if (!cfg.model_jailbreaks) cfg.model_jailbreaks = {};
  const key = resolveModelKey(model, cfg);
  if (!key) { console.error(`Model not found: ${model}`); process.exit(1); }
  if (!fs.existsSync(jpPath)) { console.error(`File not found: ${jpPath}`); process.exit(1); }
  cfg.model_jailbreaks[key] = jpPath;
  saveConfig(cfg);
  console.log(`${key} -> ${path.basename(jpPath)}`);
}

async function upgrade() {
  const files = [
    "skill/SKILL.md", "skill/config.json", "skill/jailbreak.js", "WhatModel",
    "jailbreak/Grok[Gucci].txt", "jailbreak/ChatGPTLuna.txt",
    "jailbreak/ClaudeSonnet.txt", "jailbreak/RobloxExploit.txt",
  ];
  for (const f of files) {
    try {
      const res = await httpReq(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/${f}`, { method: "GET" });
      if (res.status === 200) {
        const local = path.join(SKILL_DIR, f.replace(/^skill\//, ""));
        const dir = path.dirname(local);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(local, res.data, "utf-8");
        console.log(`ok ${f}`);
      } else {
        console.log(`skip ${f} (${res.status})`);
      }
    } catch (e) { console.log(`fail ${f} (${e.message})`); }
  }
  console.log("done");
}

// main
const [, , cmd, ...args] = process.argv;
(async () => {
  try {
    switch (cmd) {
      case "help": case undefined: help(); break;
      case "send": await send(args[0], args.includes("--auto")); break;
      case "list": list(); break;
      case "enable": enable(args[0]); break;
      case "disable": disable(args[0]); break;
      case "nowmodel": await nowmodel(args[0], args[1]); break;
      case "set-prompt": setPrompt(args[0], args[1]); break;
      case "upgrade": await upgrade(); break;
      default: console.error(`unknown: ${cmd}`); process.exit(1);
    }
  } catch (e) { console.error(e.message); process.exit(1); }
})();
