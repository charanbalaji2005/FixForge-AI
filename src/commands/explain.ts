import { scanProject, buildContextString } from "../scanner/index.ts";
import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { thinkingSpinner, sectionHeader, log, promptWithEsc } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runExplain(config: Config, targetDir = process.cwd()): Promise<void> {
  sectionHeader("💡  Error Explainer");

  const { errorMsg } = await promptWithEsc([
    {
      type: "editor",
      name: "errorMsg",
      message: chalk.cyan("Paste your error message:"),
    },
  ]);

  if (!errorMsg?.trim()) {
    log("warn", "No error provided.");
    return;
  }

  const ctx = await scanProject(targetDir);
  const contextStr = buildContextString(ctx, 15000);

  const thinkSpinner = thinkingSpinner("Explaining error");
  thinkSpinner.start();

  let result: string;
  try {
    result = await callGroq(
      config,
      [
        {
          role: "user",
          content: `Explain this error:\n\n${errorMsg}\n\nProject context:\n${contextStr}`,
        },
      ],
      SYSTEM_PROMPTS.explainer
    );
    thinkSpinner.succeed(chalk.green("Done!"));
  } catch (e) {
    thinkSpinner.fail(chalk.red("Failed: " + (e as Error).message));
    return;
  }

  console.log("\n" + chalk.cyan.bold("  📖  Explanation"));
  console.log(chalk.dim("  " + "─".repeat(48)));
  console.log(result.split("\n").map((l) => "  " + l).join("\n"));
}
