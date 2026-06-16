import { join } from "path";
import { homedir } from "os";
import type { Config, GroqModel } from "../types/index.ts";

const CONFIG_DIR = join(homedir(), ".fixforge");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export const GROQ_MODELS: GroqModel[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile (Recommended)" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Fast)" },
  { id: "llama3-70b-8192", label: "Llama3 70B 8192" },
  { id: "llama3-8b-8192", label: "Llama3 8B 8192 (Fastest)" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B 32768" },
  { id: "gemma2-9b-it", label: "Gemma2 9B IT" },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill Llama 70B (Thinking)" },
  { id: "qwen-qwq-32b", label: "Qwen QwQ 32B (Reasoning)" },
];

export const OPENAI_MODELS: GroqModel[] = [
  { id: "gpt-4o", label: "GPT-4o (Recommended)" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Cheap)" },
  { id: "o1-mini", label: "o1 Mini (Reasoning)" },
];

export const GEMINI_MODELS: GroqModel[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Fastest / Recommended)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Powerful)" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
];

export const ANTHROPIC_MODELS: GroqModel[] = [
  { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet (Recommended)" },
  { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku (Fast)" },
  { id: "claude-3-opus-latest", label: "Claude 3 Opus" },
];

export const FREE_TIER_LIMITS = {
  fixes: 50,
  scans: 20,
  explanations: 100,
};

export async function loadConfig(): Promise<Config> {
  try {
    const file = Bun.file(CONFIG_PATH);
    if (await file.exists()) {
      const text = await file.text();
      return JSON.parse(text) as Config;
    }
  } catch {}
  return { provider: "free", useFree: true };
}

export async function saveConfig(config: Config): Promise<void> {
  try {
    const fs = await import("fs/promises");
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (e) {
    const fs = await import("fs/promises");
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
  }
}

export async function getConfigPath(): Promise<string> {
  return CONFIG_PATH;
}
