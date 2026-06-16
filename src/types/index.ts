export interface Config {
  provider: "groq" | "openai" | "gemini" | "anthropic" | "free";
  apiKey?: string;
  model?: string;
  useFree?: boolean;
  groqKey?: string;
  openaiKey?: string;
  geminiKey?: string;
  anthropicKey?: string;
  groqModel?: string;
  openaiModel?: string;
  geminiModel?: string;
  anthropicModel?: string;
  freeTierCalls?: number[];
}

export interface GroqModel {
  id: string;
  label: string;
}

export interface FileInfo {
  path: string;
  content: string;
  language: string;
  lines: number;
}

export interface ProjectContext {
  rootDir: string;
  files: FileInfo[];
  packageJson?: Record<string, unknown>;
  framework?: string;
  language?: string;
  hasTypeScript?: boolean;
  totalFiles: number;
  summary: string;
}

export interface ErrorInfo {
  message: string;
  file?: string;
  line?: number;
  type?: string;
}

export interface Fix {
  file: string;
  original: string;
  fixed: string;
  explanation: string;
  diff?: string;
}

export interface AgentResult {
  agent: string;
  findings: string[];
  fixes: Fix[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}
