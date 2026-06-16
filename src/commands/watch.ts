import { callGroq } from "../providers/groq.ts";
import { SYSTEM_PROMPTS } from "../prompts/index.ts";
import { thinkingSpinner, sectionHeader, log, promptWithEsc } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runWatch(config: Config): Promise<void> {
  sectionHeader("👁️  Watch Mode");

  console.log(chalk.cyan("  FixForge Watch automatically sets up your project and monitors for errors.\n"));

  const packageJsonFile = Bun.file("package.json");
  if (await packageJsonFile.exists()) {
    log("info", "Running 'bun install' in the background...");
    try {
      const installProc = Bun.spawn(["bun", "install"], { cwd: process.cwd() });
      await installProc.exited;
      log("success", "Dependencies verified.");
    } catch (e) {
      log("warn", "Could not run bun install: " + (e as Error).message);
    }
  }

  const cmd = "bun run dev";
  log("info", `Starting dev server in the background (${cmd})...`);
  log("info", "Watching for errors... Press Ctrl+C to stop.\n");

  const proc = Bun.spawn(["bun", "run", "dev"], {
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
