import { scanProject, buildContextString } from "../scanner/index.ts";
import { callGroq } from "../providers/groq.ts";
import { thinkingSpinner, sectionHeader, log, promptWithEsc } from "../ui/index.ts";
import type { Config, Message } from "../types/index.ts";
import chalk from "chalk";

export async function runChat(config: Config, targetDir = process.cwd()): Promise<void> {
  sectionHeader("💬  Chat with FixForge AI");

  console.log(chalk.dim("  Loading project context...\n"));
  const ctx = await scanProject(targetDir);
  const contextStr = buildContextString(ctx, 15000);

  const systemPrompt = `You are FixForge, an expert AI coding assistant.
You help debug, fix, explain, and improve code.
Project context:\n${contextStr}

Be concise, practical, and always show code examples.`;

  const history: Message[] = [];

  console.log(chalk.cyan.bold("  💬 Chat started! Type 'exit' to quit.\n"));

  while (true) {
    let input: string;
    try {
      const res = await promptWithEsc([
        {
          type: "input",
          name: "input",
          message: chalk.cyan("You:"),
          prefix: "",
        },
      ]);
      input = res.input;
    } catch (e) {
      if ((e as Error).message === "CANCELLED_BY_ESCAPE") {
        log("info", "Chat ended.");
        break;
      }
      throw e;
    }

    if (!input?.trim() || input.toLowerCase() === "exit") {
      log("info", "Chat ended.");
      break;
    }

    history.push({ role: "user", content: input });

    const thinkSpinner = thinkingSpinner("FixForge is thinking");
    thinkSpinner.start();

    let reply: string;
    try {
      reply = await callGroq(config, history, systemPrompt);
      thinkSpinner.succeed(chalk.green("Response ready"));
    } catch (e) {
      thinkSpinner.fail(chalk.red("Error: " + (e as Error).message));
      continue;
    }

    history.push({ role: "assistant", content: reply });

    console.log("\n" + chalk.cyan.bold("  FixForge:"));
    console.log(reply.split("\n").map((l) => "  " + chalk.white(l)).join("\n") + "\n");
  }
}
