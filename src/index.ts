#!/usr/bin/env bun
import inquirer from "inquirer";
import chalk from "chalk";
import { loadConfig } from "./config/index.ts";
import { banner, sectionHeader, log, infoBox, createTable, promptWithEsc } from "./ui/index.ts";
import { runScan } from "./commands/scan.ts";
import { runFix } from "./commands/fix.ts";
import { runExplain } from "./commands/explain.ts";
import { runSecurity } from "./commands/security.ts";
import { runReview } from "./commands/review.ts";
import { runDoctor } from "./commands/doctor.ts";
import { runWatch } from "./commands/watch.ts";
import { runRefactor } from "./commands/refactor.ts";
import { runProvider } from "./commands/provider.ts";
import { runChat } from "./commands/chat.ts";
import type { Config } from "./types/index.ts";

const VERSION = "1.0.0";

async function showStatus(config: Config): Promise<void> {
  const providerLabel = config.useFree
    ? chalk.yellow("Free Tier (50 fixes/day)")
    : chalk.green(`${config.provider.toUpperCase()} — ${config.model || "default"}`);

  const table = createTable(
    ["", ""],
    [
      [chalk.dim("Provider"), providerLabel],
      [chalk.dim("Project"), chalk.white(process.cwd().split("/").pop() || ".")],
      [chalk.dim("Version"), chalk.dim(VERSION)],
    ]
  );
  console.log(table);
}

async function mainMenu(config: Config): Promise<void> {
  const choices = [
    { name: chalk.cyan("1.") + "  🔍  Scan Project          " + chalk.dim("— analyze codebase"), value: "scan" },
    { name: chalk.cyan("2.") + "  🔧  Fix Errors            " + chalk.dim("— auto-fix bugs"), value: "fix" },
    { name: chalk.cyan("3.") + "  💡  Explain Error         " + chalk.dim("— understand errors"), value: "explain" },
    { name: chalk.cyan("4.") + "  📐  Review Architecture   " + chalk.dim("— score your design"), value: "review" },
    { name: chalk.cyan("5.") + "  🔒  Security Audit        " + chalk.dim("— find vulnerabilities"), value: "security" },
    { name: chalk.cyan("6.") + "  ♻️   Refactor Code         " + chalk.dim("— improve quality"), value: "refactor" },
    { name: chalk.cyan("7.") + "  👁️   Watch Terminal        " + chalk.dim("— monitor for errors"), value: "watch" },
    { name: chalk.cyan("8.") + "  🩺  Doctor Mode           " + chalk.dim("— full health check"), value: "doctor" },
    { name: chalk.cyan("9.") + "  💬  Chat with AI          " + chalk.dim("— ask anything"), value: "chat" },
    { name: chalk.cyan("0.") + "  ⚙️   Configure Provider    " + chalk.dim("— API key / model"), value: "provider" },
    new inquirer.Separator(chalk.dim("─".repeat(52))),
    { name: chalk.dim("  Exit"), value: "exit" },
  ];

  try {
    const { action } = await promptWithEsc([
      {
        type: "list",
        name: "action",
        message: chalk.cyan.bold("What would you like to do?"),
        choices,
        pageSize: 14,
      },
    ]);
    return action;
  } catch (e) {
    if ((e as Error).message === "CANCELLED_BY_ESCAPE") {
      return "exit";
    }
    throw e;
  }
}

async function handleCliArgs(args: string[], config: Config): Promise<boolean> {
  const cmd = args[0];
  const targetDir = args[1] || process.cwd();

  switch (cmd) {
    case "scan": await runScan(config, targetDir); return true;
    case "fix": await runFix(config, targetDir); return true;
    case "explain": await runExplain(config, targetDir); return true;
    case "security": await runSecurity(config, targetDir); return true;
    case "review": await runReview(config, targetDir); return true;
    case "refactor": await runRefactor(config, targetDir); return true;
    case "watch": await runWatch(config); return true;
    case "doctor": await runDoctor(config, targetDir); return true;
    case "chat": await runChat(config, targetDir); return true;
    case "provider": await runProvider(); return true;
    case "--version":
    case "-v":
      console.log(`fixforge v${VERSION}`);
      return true;
    case "--help":
    case "-h":
      showHelp();
      return true;
    default:
      return false;
  }
}

function showHelp(): void {
  console.log(chalk.cyan.bold("\n  FixForge CLI — AI Code Debugger\n"));
  const cmds = [
    ["fixforge", "Launch interactive menu"],
    ["fixforge scan", "Scan and analyze project"],
    ["fixforge fix", "Find and fix errors"],
    ["fixforge explain", "Explain an error"],
    ["fixforge security", "Security audit"],
    ["fixforge review", "Architecture review"],
    ["fixforge refactor", "Refactor suggestions"],
    ["fixforge watch", "Watch for runtime errors"],
    ["fixforge doctor", "Full health check"],
    ["fixforge chat", "Chat with AI about your code"],
    ["fixforge provider", "Configure API key/model"],
  ];

  cmds.forEach(([cmd, desc]) => {
    console.log(`  ${chalk.cyan(cmd.padEnd(22))} ${chalk.dim(desc)}`);
  });
  console.log();
}

async function main(): Promise<void> {
  banner();

  let config = await loadConfig();

  // Handle CLI args (e.g. `fixforge scan`)
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const handled = await handleCliArgs(args, config);
    if (handled) return;
  }

  // Interactive mode
  await showStatus(config);

  while (true) {
    const action = await mainMenu(config);

    if (action === "exit") {
      console.log(chalk.cyan("\n  👋  Thanks for using FixForge! Happy coding!\n"));
      process.exit(0);
    }

    try {
      switch (action) {
        case "scan":     await runScan(config); break;
        case "fix":      await runFix(config); break;
        case "explain":  await runExplain(config); break;
        case "security": await runSecurity(config); break;
        case "review":   await runReview(config); break;
        case "refactor": await runRefactor(config); break;
        case "watch":    await runWatch(config); break;
        case "doctor":   await runDoctor(config); break;
        case "chat":     await runChat(config); break;
        case "provider":
          config = await runProvider();
          break;
      }
    } catch (e) {
      if ((e as Error).message === "CANCELLED_BY_ESCAPE") {
        console.log(chalk.dim("\n  ↩  Action cancelled. Returning to main menu..."));
      } else {
        log("error", "Command failed: " + (e as Error).message);
      }
    }

    console.log();
    let cont = true;
    try {
      const res = await promptWithEsc([
        {
          type: "confirm",
          name: "cont",
          message: chalk.dim("Return to main menu?"),
          default: true,
        },
      ]);
      cont = res.cont;
    } catch (e) {
      if ((e as Error).message === "CANCELLED_BY_ESCAPE") {
        cont = true;
      }
    }
    if (!cont) {
      console.log(chalk.cyan("\n  👋  Thanks for using FixForge!\n"));
      process.exit(0);
    }
  }
}

main().catch((e) => {
  console.error(chalk.red("Fatal error: " + e.message));
  process.exit(1);
});
