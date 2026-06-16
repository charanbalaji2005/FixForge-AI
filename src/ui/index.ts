import chalk from "chalk";
import boxen from "boxen";
import ora from "ora";
import Table from "cli-table3";

export const colors = {
  primary: chalk.cyan,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.dim,
  bold: chalk.bold,
  white: chalk.white,
  magenta: chalk.magenta,
};

export function banner(): void {
  const content =
    chalk.cyan.bold("  ███████╗██╗██╗  ██╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗\n") +
    chalk.cyan.bold("  ██╔════╝██║╚██╗██╔╝██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝\n") +
    chalk.cyan.bold("  █████╗  ██║ ╚███╔╝ █████╗  ██║   ██║██████╔╝██║  ███╗█████╗  \n") +
    chalk.cyan.bold("  ██╔══╝  ██║ ██╔██╗ ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  \n") +
    chalk.cyan.bold("  ██║     ██║██╔╝ ██╗██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗\n") +
    chalk.cyan.bold("  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝\n") +
    "\n" +
    chalk.white("         ") + chalk.yellow("⚡") + chalk.white("  AI Debugging & Code Fixer  ") + chalk.yellow("⚡");

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "double",
      borderColor: "cyan",
    })
  );
}

export function sectionHeader(title: string): void {
  console.log("\n" + chalk.cyan("━".repeat(50)));
  console.log(chalk.cyan.bold(`  ${title}`));
  console.log(chalk.cyan("━".repeat(50)));
}

export function successBox(message: string): void {
  console.log(
    boxen(chalk.green.bold(message), {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: "round",
      borderColor: "green",
    })
  );
}

export function errorBox(message: string): void {
  console.log(
    boxen(chalk.red.bold(message), {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: "round",
      borderColor: "red",
    })
  );
}

export function infoBox(title: string, lines: string[]): void {
  const content = lines.map((l) => chalk.white(l)).join("\n");
  console.log(
    boxen(chalk.cyan.bold(title) + "\n\n" + content, {
      padding: 1,
      borderStyle: "round",
      borderColor: "cyan",
    })
  );
}

export function createSpinner(text: string) {
  return ora({
    text: chalk.cyan(text),
    spinner: {
      interval: 80,
      frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
    },
    color: "cyan",
  });
}

export function thinkingSpinner(text = "AI is thinking") {
  const frames = [
    chalk.cyan("🧠 ") + chalk.dim(text + " .  "),
    chalk.cyan("🧠 ") + chalk.dim(text + " .. "),
    chalk.cyan("🧠 ") + chalk.dim(text + " ..."),
    chalk.cyan("💡 ") + chalk.dim(text + " ..."),
  ];
  return ora({
    text: frames[0],
    spinner: { interval: 200, frames },
    color: "cyan",
  });
}

export function printDiff(original: string, fixed: string, filename: string): void {
  console.log("\n" + chalk.cyan.bold(`📄 Diff: ${filename}`));
  console.log(chalk.dim("─".repeat(60)));

  const origLines = original.split("\n");
  const fixedLines = fixed.split("\n");

  // Simple unified-like diff display
  const maxLines = Math.max(origLines.length, fixedLines.length);
  for (let i = 0; i < maxLines; i++) {
    const o = origLines[i];
    const f = fixedLines[i];
    if (o === undefined) {
      console.log(chalk.green("+ " + f));
    } else if (f === undefined) {
      console.log(chalk.red("- " + o));
    } else if (o !== f) {
      console.log(chalk.red("- " + o));
      console.log(chalk.green("+ " + f));
    } else {
      console.log(chalk.dim("  " + o));
    }
  }
  console.log(chalk.dim("─".repeat(60)));
}

export function createTable(head: string[], rows: string[][]): string {
  const table = new Table({
    head: head.map((h) => chalk.cyan.bold(h)),
    style: { border: ["cyan"], head: [] },
    chars: {
      top: "─", "top-mid": "┬", "top-left": "┌", "top-right": "┐",
      bottom: "─", "bottom-mid": "┴", "bottom-left": "└", "bottom-right": "┘",
      left: "│", "left-mid": "├", mid: "─", "mid-mid": "┼",
      right: "│", "right-mid": "┤", middle: "│",
    },
  });
  rows.forEach((r) => table.push(r));
  return table.toString();
}

export function log(type: "success" | "error" | "info" | "warn" | "step", msg: string): void {
  const icons = { success: "✓", error: "✗", info: "ℹ", warn: "⚠", step: "→" };
  const colorFns = {
    success: chalk.green,
    error: chalk.red,
    info: chalk.blue,
    warn: chalk.yellow,
    step: chalk.cyan,
  };
  console.log(colorFns[type](`  ${icons[type]}  ${msg}`));
}

import inquirer from "inquirer";

export function promptWithEsc<T = any>(questions: any[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const promptPromise = inquirer.prompt(questions);
    let isClosed = false;

    const keypressHandler = (char: any, key: any) => {
      if (key && key.name === "escape") {
        isClosed = true;
        if (promptPromise.ui && promptPromise.ui.rl && promptPromise.ui.rl.input) {
          promptPromise.ui.rl.input.removeListener("keypress", keypressHandler);
        }
        try {
          promptPromise.ui.close();
        } catch {}
        reject(new Error("CANCELLED_BY_ESCAPE"));
      }
    };

    if (promptPromise.ui && promptPromise.ui.rl && promptPromise.ui.rl.input) {
      promptPromise.ui.rl.input.on("keypress", keypressHandler);
    }

    promptPromise.then(
      (res) => {
        if (!isClosed) {
          if (promptPromise.ui && promptPromise.ui.rl && promptPromise.ui.rl.input) {
            promptPromise.ui.rl.input.removeListener("keypress", keypressHandler);
          }
          resolve(res as T);
        }
      },
      (err) => {
        if (!isClosed) {
          if (promptPromise.ui && promptPromise.ui.rl && promptPromise.ui.rl.input) {
            promptPromise.ui.rl.input.removeListener("keypress", keypressHandler);
          }
          reject(err);
        }
      }
    );
  });
}
