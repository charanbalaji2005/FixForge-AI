import { loadConfig, saveConfig, GROQ_MODELS, OPENAI_MODELS, GEMINI_MODELS, ANTHROPIC_MODELS, getConfigPath } from "../config/index.ts";
import { sectionHeader, log, infoBox, createTable, promptWithEsc } from "../ui/index.ts";
import type { Config } from "../types/index.ts";
import chalk from "chalk";

export async function runProvider(): Promise<Config> {
  sectionHeader("⚙️  Configure AI Provider");

  const current = await loadConfig();

  const table = createTable(
    ["Setting", "Current Value"],
    [
      ["Provider", chalk.cyan(current.provider)],
      ["Model", chalk.cyan(current.model || "default")],
      ["API Key", current.apiKey ? chalk.green("Set ✓") : chalk.yellow("Not set")],
      ["Mode", current.useFree ? chalk.yellow("Free Tier") : chalk.green("Custom Key")],
    ]
  );
  console.log("\n" + table + "\n");

  const { mode } = await promptWithEsc([
    {
      type: "list",
      name: "mode",
      message: chalk.cyan("Choose Provider / Mode:"),
      choices: [
        { name: "🆓  Free Tier (no API key needed, limited usage)", value: "free" },
        { name: "🔑  Custom Groq API Key", value: "groq" },
        { name: "🧠  Custom OpenAI API Key", value: "openai" },
        { name: "✨  Custom Gemini API Key", value: "gemini" },
        { name: "🦉  Custom Claude (Anthropic) API Key", value: "anthropic" },
      ],
    },
  ]);

  if (mode === "free") {
    const config: Config = { ...current, provider: "free", useFree: true, model: undefined, apiKey: undefined };
    await saveConfig(config);
    log("success", "Free tier activated!");
    return config;
  }

  // Determine models list and validation functions
  let modelsList: { id: string; label: string }[];
  let keyValidator: (val: string) => boolean | string;
  let keyFieldName: keyof Config;
  let modelFieldName: keyof Config;

  switch (mode) {
    case "groq":
      modelsList = GROQ_MODELS;
      keyValidator = (val: string) => val.startsWith("gsk_") ? true : "Groq keys start with gsk_";
      keyFieldName = "groqKey";
      modelFieldName = "groqModel";
      break;
    case "openai":
      modelsList = OPENAI_MODELS;
      keyValidator = (val: string) => val.startsWith("sk-") ? true : "OpenAI keys start with sk-";
      keyFieldName = "openaiKey";
      modelFieldName = "openaiModel";
      break;
    case "gemini":
      modelsList = GEMINI_MODELS;
      keyValidator = (val: string) => val.startsWith("AIzaSy") || val.length > 20 ? true : "Gemini keys usually start with AIzaSy";
      keyFieldName = "geminiKey";
      modelFieldName = "geminiModel";
      break;
    case "anthropic":
      modelsList = ANTHROPIC_MODELS;
      keyValidator = (val: string) => val.startsWith("sk-ant-") ? true : "Claude keys start with sk-ant-";
      keyFieldName = "anthropicKey";
      modelFieldName = "anthropicModel";
      break;
    default:
      throw new Error(`Unknown provider: ${mode}`);
  }

  const { model } = await promptWithEsc([
    {
      type: "list",
      name: "model",
      message: chalk.cyan(`Select ${mode} model:`),
      choices: modelsList.map((m) => ({ name: m.label, value: m.id })),
      default: (current[modelFieldName] as string) || modelsList[0].id,
    },
  ]);

  const { apiKey } = await promptWithEsc([
    {
      type: "password",
      name: "apiKey",
      message: chalk.cyan(`Enter your ${mode} API key:`),
      default: (current[keyFieldName] as string) || "",
      validate: keyValidator,
    },
  ]);

  const config: Config = {
    ...current,
    provider: mode,
    apiKey,
    model,
    useFree: false,
    [keyFieldName]: apiKey,
    [modelFieldName]: model,
  } as Config;

  await saveConfig(config);
  const configPath = await getConfigPath();

  log("success", `Configuration saved to ${configPath}`);
  log("info", `Provider: ${mode}`);
  log("info", `Model: ${model}`);
  log("success", `You now have custom access to ${mode.toUpperCase()} AI!`);

  return config;
}
