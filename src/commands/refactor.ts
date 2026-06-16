import { scanProject, buildContextString } from "../scanner/index.ts";
import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { createSpinner, thinkingSpinner, sectionHeader } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runRefactor(config: Config, targetDir = process.cwd()): Promise<void> {
  sectionHeader("♻️  Refactor Advisor");

  const scanSpinner = createSpinner("Loading project...");
  scanSpinner.start();
  const ctx = await scanProject(targetDir);
  scanSpinner.succeed(chalk.green(`${ctx.totalFiles} files loaded`));

  const contextStr = buildContextString(ctx, 20000);

  const thinkSpinner = thinkingSpinner("Finding refactor opportunities");
  thinkSpinner.start();

  let result: string;
  try {
    result = await callGroq(
      config,
      [{ role: "user", content: `Suggest refactoring improvements for:\n\n${contextStr}` }],
      SYSTEM_PROMPTS.refactor,
      5000
    );
    thinkSpinner.succeed(chalk.green("Refactor suggestions ready!"));
  } catch (e) {
    thinkSpinner.fail(chalk.red("Failed: " + (e as Error).message));
    return;
  }

  console.log("\n" + chalk.magenta.bold("  ♻️  Refactor Suggestions"));
  console.log(chalk.dim("  " + "─".repeat(48)));
  console.log(result.split("\n").map((l) => "  " + l).join("\n"));
}
