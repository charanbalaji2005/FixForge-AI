import { scanProject, buildContextString } from "../scanner/index.ts";
import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { createSpinner, thinkingSpinner, sectionHeader, createTable } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runReview(config: Config, targetDir = process.cwd()): Promise<void> {
  sectionHeader("📐  Architecture Review");

  const scanSpinner = createSpinner("Analyzing architecture...");
  scanSpinner.start();
  const ctx = await scanProject(targetDir);
  scanSpinner.succeed(chalk.green("Project loaded"));

  const contextStr = buildContextString(ctx, 20000);

  const thinkSpinner = thinkingSpinner("Reviewing architecture");
  thinkSpinner.start();

  let result: string;
  try {
    result = await callGroq(
      config,
      [{ role: "user", content: `Review the architecture of this project:\n\n${contextStr}` }],
      SYSTEM_PROMPTS.architect,
      5000
    );
    thinkSpinner.succeed(chalk.green("Review complete!"));
  } catch (e) {
    thinkSpinner.fail(chalk.red("Review failed: " + (e as Error).message));
    return;
  }

  console.log("\n" + chalk.magenta.bold("  🏗️  Architecture Report"));
  console.log(chalk.dim("  " + "─".repeat(48)));
  console.log(result.split("\n").map((l) => "  " + l).join("\n"));
}
