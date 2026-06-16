import { scanProject, buildContextString } from "../scanner/index.ts";
import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { createSpinner, thinkingSpinner, sectionHeader, log } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runSecurity(config: Config, targetDir = process.cwd()): Promise<void> {
  sectionHeader("🔒  Security Audit");

  const scanSpinner = createSpinner("Scanning for vulnerabilities...");
  scanSpinner.start();
  const ctx = await scanProject(targetDir);
  scanSpinner.succeed(chalk.green(`Scanned ${ctx.totalFiles} files`));

  const contextStr = buildContextString(ctx, 20000);

  const thinkSpinner = thinkingSpinner("Running security analysis");
  thinkSpinner.start();

  let result: string;
  try {
    result = await callGroq(
      config,
      [{ role: "user", content: `Audit this codebase for security issues:\n\n${contextStr}` }],
      SYSTEM_PROMPTS.security,
      5000
    );
    thinkSpinner.succeed(chalk.green("Audit complete!"));
  } catch (e) {
    thinkSpinner.fail(chalk.red("Audit failed: " + (e as Error).message));
    return;
  }

  console.log("\n" + chalk.red.bold("  🛡️  Security Report"));
  console.log(chalk.dim("  " + "─".repeat(48)));
  console.log(result.split("\n").map((l) => "  " + l).join("\n"));
}
