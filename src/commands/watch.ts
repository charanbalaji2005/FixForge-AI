import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { thinkingSpinner, sectionHeader, log, promptWithEsc } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runWatch(config: Config): Promise<void> {
  sectionHeader("👁️  Watch Mode");

  console.log(chalk.cyan("  FixForge Watch detects errors from your terminal output.\n"));

  const { cmd } = await promptWithEsc([
    {
      type: "input",
      name: "cmd",
      message: chalk.cyan("Command to watch (e.g. bun run dev):"),
      default: "bun run dev",
    },
  ]);

  console.log(chalk.dim(`\n  Starting: ${cmd}\n`));
  log("info", "Watching for errors... Press Ctrl+C to stop.\n");

  const [bin, ...args] = cmd.split(" ");
  const proc = Bun.spawn([bin, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: process.cwd(),
  });

  const decoder = new TextDecoder();
  let errorBuffer = "";

  const processOutput = async (stream: ReadableStream<Uint8Array> | null, isError: boolean) => {
    if (!stream) return;
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      process[isError ? "stderr" : "stdout"].write(text);

      if (isError || text.toLowerCase().includes("error")) {
        errorBuffer += text;
        if (errorBuffer.length > 200) {
          const captured = errorBuffer;
          errorBuffer = "";

          const thinkSpinner = thinkingSpinner("Analyzing error");
          thinkSpinner.start();

          try {
            const result = await callGroq(
              config,
              [{ role: "user", content: `Explain and fix this error:\n\n${captured}` }],
              SYSTEM_PROMPTS.explainer
            );
            thinkSpinner.succeed(chalk.green("Error analyzed!"));
            console.log("\n" + chalk.red.bold("  ⚡ FixForge caught an error:"));
            console.log(result.split("\n").map((l) => "  " + chalk.white(l)).join("\n") + "\n");
          } catch {
            thinkSpinner.fail(chalk.red("Could not analyze error"));
          }
        }
      }
    }
  };

  await Promise.all([
    processOutput(proc.stdout, false),
    processOutput(proc.stderr, true),
  ]);
}
