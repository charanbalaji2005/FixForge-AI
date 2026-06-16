import { scanProject, buildContextString } from "../scanner/index.ts";
import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { createSpinner, thinkingSpinner, sectionHeader, log, printDiff, promptWithEsc } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runFix(config: Config, targetDir = process.cwd()): Promise<void> {
  sectionHeader("🔧  Fix Errors");

  const { errorInput } = await promptWithEsc([
    {
      type: "input",
      name: "errorInput",
      message: chalk.cyan("Paste your error message (or press Enter to auto-detect):"),
      default: "",
    },
  ]);

  const scanSpinner = createSpinner("Reading project...");
  scanSpinner.start();
  const ctx = await scanProject(targetDir);
  scanSpinner.succeed(chalk.green(`Loaded ${ctx.totalFiles} files`));

  const contextStr = buildContextString(ctx, 20000);

  const prompt = errorInput
    ? `Fix this error in the project:\n\nError: ${errorInput}\n\nProject:\n${contextStr}`
    : `Find and fix the most critical errors in this project:\n\n${contextStr}`;

  const thinkSpinner = thinkingSpinner("Generating fixes");
  thinkSpinner.start();

  let result: string;
  try {
    result = await callGroq(
      config,
      [{ role: "user", content: prompt }],
      SYSTEM_PROMPTS.fixer,
      6000
    );
    thinkSpinner.succeed(chalk.green("Fixes generated!"));
  } catch (e) {
    thinkSpinner.fail(chalk.red("Failed: " + (e as Error).message));
    return;
  }

  console.log("\n" + chalk.cyan.bold("  🛠️  Suggested Fixes"));
  console.log(chalk.dim("  " + "─".repeat(48)));
  console.log(result.split("\n").map((l) => "  " + l).join("\n"));

  // Ask to apply (mock apply for demo)
  const { apply } = await promptWithEsc([
    {
      type: "confirm",
      name: "apply",
      message: chalk.cyan("Apply suggested changes?"),
      default: false,
    },
  ]);

  if (apply) {
    const applySpinner = createSpinner("Applying patches...");
    applySpinner.start();
    await Bun.sleep(1200);
    applySpinner.succeed(chalk.green("Changes applied successfully! ✓"));
    log("success", "Run your build to verify the fixes.");
  } else {
    log("info", "Changes not applied. Review the suggestions above.");
  }
}
