import { scanProject, buildContextString } from "../scanner/index.ts";
import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { createSpinner, thinkingSpinner, sectionHeader, log, infoBox, createTable } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runScan(config: Config, targetDir = process.cwd()): Promise<void> {
  sectionHeader("🔍  Project Scanner");

  const scanSpinner = createSpinner("Scanning project files...");
  scanSpinner.start();

  const ctx = await scanProject(targetDir);
  scanSpinner.succeed(chalk.green(`Scanned ${ctx.totalFiles} files`));

  // Show project table
  const table = createTable(
    ["Property", "Value"],
    [
      ["Project", chalk.white(ctx.packageJson?.name as string || targetDir.split("/").pop() || "unknown")],
      ["Framework", chalk.cyan(ctx.framework || "Unknown")],
      ["Language", chalk.cyan(ctx.language || "Unknown")],
      ["TypeScript", ctx.hasTypeScript ? chalk.green("Yes ✓") : chalk.yellow("No")],
      ["Files Scanned", chalk.white(String(ctx.totalFiles))],
      ["Total Lines", chalk.white(String(ctx.files.reduce((a, f) => a + f.lines, 0)))],
    ]
  );
  console.log("\n" + table);

  const thinkSpinner = thinkingSpinner("Analyzing architecture");
  thinkSpinner.start();

  const contextStr = buildContextString(ctx, 20000);

  let analysis: string;
  try {
    analysis = await callGroq(
      config,
      [{ role: "user", content: `Analyze this project:\n\n${contextStr}` }],
      SYSTEM_PROMPTS.scanner
    );
    thinkSpinner.succeed(chalk.green("Analysis complete"));
  } catch (e) {
    thinkSpinner.fail(chalk.red("Analysis failed: " + (e as Error).message));
    return;
  }

  console.log("\n" + chalk.cyan.bold("  📊 Architecture Analysis"));
  console.log(chalk.dim("  " + "─".repeat(48)));
  console.log(analysis
    .split("\n")
    .map((l) => "  " + l)
    .join("\n"));

  log("success", "Project scan complete!");
}
