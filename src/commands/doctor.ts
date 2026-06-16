import { scanProject, buildContextString } from "../scanner/index.ts";
import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { createSpinner, thinkingSpinner, sectionHeader, log, successBox } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runDoctor(config: Config, targetDir = process.cwd()): Promise<void> {
  sectionHeader("🩺  Doctor Mode — Full Project Health Check");

  const steps = [
    "Scanning all files...",
    "Detecting errors...",
    "Running security checks...",
    "Analyzing architecture...",
    "Generating health report...",
  ];

  for (const step of steps) {
    const s = createSpinner(step);
    s.start();
    await Bun.sleep(600);
    s.succeed(chalk.green(step.replace("...", " done")));
  }

  const ctx = await scanProject(targetDir);
  const contextStr = buildContextString(ctx, 20000);

  const thinkSpinner = thinkingSpinner("Running full diagnosis");
  thinkSpinner.start();

  let result: string;
  try {
    result = await callGroq(
      config,
      [
        {
          role: "user",
          content: `Run a full health check on this project and give a health score:\n\n${contextStr}`,
        },
      ],
      SYSTEM_PROMPTS.doctor,
      6000
    );
    thinkSpinner.succeed(chalk.green("Diagnosis complete!"));
  } catch (e) {
    thinkSpinner.fail(chalk.red("Failed: " + (e as Error).message));
    return;
  }

  console.log("\n" + chalk.green.bold("  🩺  Health Report"));
  console.log(chalk.dim("  " + "─".repeat(48)));
  console.log(result.split("\n").map((l) => "  " + l).join("\n"));

  successBox("  Doctor check complete! Review the report above.  ");
}
