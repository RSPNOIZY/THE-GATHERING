#!/usr/bin/env node
import "dotenv/config";
import { createInterface } from "node:readline";
import { stdin, stdout, argv, env, exit } from "node:process";
import { runTurn } from "./gabriel.js";
import { speak, prepareForSpeech } from "./voice.js";
import { startDaemon } from "./daemon.js";
import chalk from "chalk";
const args = argv.slice(2);
const mode = args.includes("--daemon") ? "daemon" : args.includes("--status") ? "status" : "chat";
function preflight() {
    if (!env.ANTHROPIC_API_KEY && env.GABRIEL_FOSS_ONLY !== "true") {
        console.error(chalk.red("✗ ANTHROPIC_API_KEY not set. Copy .env.example → .env, fill in, retry."));
        exit(1);
    }
    if (env.GABRIEL_FOSS_ONLY === "true" || !env.ANTHROPIC_API_KEY) {
        console.log(chalk.yellow("⚠ GABRIEL starting in FOSS-ONLY mode. Using local Ollama inference."));
    }
}
function banner() {
    const date = new Date().toISOString().slice(0, 10);
    const target = env.GABRIEL_TARGET_DATE || "2026-05-17";
    const label = env.GABRIEL_TARGET_LABEL || "next milestone";
    const days = Math.max(0, Math.ceil((new Date(target).getTime() - Date.now()) / 86400000));
    console.log(chalk.bold.cyan("═══════════════════════════════════════════"));
    console.log(chalk.bold.cyan("  GABRIEL ONLINE — NOIZY EMPIRE"));
    console.log(chalk.cyan(`  ${date} | ${days} days to ${label}`));
    console.log(chalk.bold.cyan("═══════════════════════════════════════════"));
    console.log();
}
async function runStatus() {
    const result = await runTurn({
        input: "Give me the boot greeting: date, days remaining, top critical-path blocker. Under 8 lines.",
        tier: "FAST",
    });
    console.log(result.output);
    console.log(chalk.dim(`\n[${result.tier} · ${result.model} · ${result.durationMs}ms]`));
    void speak(prepareForSpeech(result.output), "gabriel");
}
async function runChat() {
    banner();
    console.log(chalk.dim("Type your message. Ctrl-D or /exit to quit. /status for quick check.\n"));
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    const prompt = chalk.bold.green("rob › ");
    rl.setPrompt(prompt);
    rl.prompt();
    rl.on("line", async (line) => {
        const input = line.trim();
        if (!input)
            return rl.prompt();
        if (input === "/exit" || input === "/quit") {
            rl.close();
            return;
        }
        stdout.write(chalk.bold.magenta("\ngabriel › "));
        const result = await runTurn({
            input,
            onChunk: (text) => stdout.write(text),
        });
        console.log(chalk.dim(`\n\n[${result.tier} · ${result.model.split("-").slice(0, 2).join("-")} · ${result.durationMs}ms]\n`));
        // Speak the reply in Jamie (Premium) via the voice-service on :9799.
        // Set GABRIEL_VOICE=off in env to silence.
        void speak(prepareForSpeech(result.output), "gabriel");
        rl.prompt();
    });
    rl.on("close", () => {
        console.log(chalk.dim("\n—gabriel out—"));
        exit(0);
    });
}
async function runDaemon() {
    banner();
    startDaemon();
    // startDaemon registers SIGTERM/SIGINT handlers; node keeps the event loop
    // alive because the HTTP server is holding a listen handle.
}
// Daemon mode is an intent router — it does not need ANTHROPIC_API_KEY up front.
// Chat and status modes call Claude directly, so they do.
if (mode !== "daemon")
    preflight();
if (mode === "status")
    await runStatus();
else if (mode === "daemon")
    await runDaemon();
else
    await runChat();
//# sourceMappingURL=index.js.map