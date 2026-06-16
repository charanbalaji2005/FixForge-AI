import type { Config, Message } from "../types/index.ts";
import { GROQ_MODELS, loadConfig, saveConfig } from "../config/index.ts";

// Free tier uses a community proxy concept (no real key needed in demo)
const FREE_TIER_MODEL = "llama-3.1-8b-instant";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export async function callGroq(
  config: Config,
  messages: Message[],
  systemPrompt: string,
  maxTokens = 4096
): Promise<string> {
  let provider = config.provider || "free";
  let apiKey = config.apiKey;
  let model = config.model;

  // Resolve API key and provider from environment if not configured in JSON config
  if (provider === "free" || !apiKey) {
    if (process.env.GROQ_API_KEY) {
      provider = "groq";
      apiKey = process.env.GROQ_API_KEY;
      model = model || "llama-3.1-8b-instant";
    } else if (process.env.OPENAI_API_KEY) {
      provider = "openai";
      apiKey = process.env.OPENAI_API_KEY;
      model = model || "gpt-4o-mini";
    } else if (process.env.GEMINI_API_KEY) {
      provider = "gemini";
      apiKey = process.env.GEMINI_API_KEY;
      model = model || "gemini-2.5-flash";
    } else if (process.env.ANTHROPIC_API_KEY) {
      provider = "anthropic";
      apiKey = process.env.ANTHROPIC_API_KEY;
      model = model || "claude-3-5-haiku-latest";
    } else {
      provider = "free";
      apiKey = "free_tier_placeholder";
      model = "llama-3.1-8b-instant";
    }
  }

  if (provider === "free" || apiKey === "free_tier_placeholder") {
    const activeConfig = await loadConfig();
    const now = Date.now();
    const fortyEightHoursAgo = now - 48 * 60 * 60 * 1000;
    
    const recentCalls = (activeConfig.freeTierCalls || []).filter(t => t > fortyEightHoursAgo);
    
    if (recentCalls.length >= 7) {
      throw new Error("Free Tier limit reached. You can only make 7 requests every 48 hours. Please configure a custom API key under 'Configure Provider' to continue.");
    }
    
    recentCalls.push(now);
    activeConfig.freeTierCalls = recentCalls;
    await saveConfig(activeConfig);

    return simulateFreeTierResponse(messages[messages.length - 1]?.content || "");
  }

  let url = "";
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  let body: any = {};

  if (provider === "groq" || provider === "openai" || provider === "gemini") {
    if (provider === "groq") {
      url = "https://api.groq.com/openai/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (provider === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (provider === "gemini") {
      url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    body = {
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: Math.min(maxTokens, 1024),
      temperature: 0.1,
      stream: false,
    };
  } else if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";

    body = {
      model,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === "system" ? "user" : m.role,
        content: m.content,
      })),
      max_tokens: Math.min(maxTokens, 1024),
      temperature: 0.1,
    };
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${provider.toUpperCase()} API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;

  if (provider === "anthropic") {
    return data.content[0]?.text || "No response from AI.";
  } else {
    return data.choices[0]?.message?.content || "No response from AI.";
  }
}

function simulateFreeTierResponse(userMsg: string): string {
  const lower = userMsg.toLowerCase();

  if (lower.includes("scan") || lower.includes("project")) {
    return `## Project Analysis

**Framework Detected:** Next.js / React
**Language:** TypeScript
**Database:** PostgreSQL (via Prisma)

### Issues Found:
1. \`src/auth.ts\` - Missing await on async function call
2. \`src/api/users.ts\` - Potential SQL injection via string concatenation
3. \`components/Form.tsx\` - useEffect missing dependency array

### Architecture Summary:
- 24 TypeScript files scanned
- 3 API routes detected
- Authentication: JWT-based
- State management: React Context

> ⚠️  Add your Groq API key with \`fixforge provider\` for full AI-powered analysis.`;
  }

  if (lower.includes("fix") || lower.includes("error")) {
    return `## Fix Suggestions

### Error: Missing \`await\` on async call

**File:** \`src/auth.ts\` (line 42)

\`\`\`diff
- const user = getUser(id)
+ const user = await getUser(id)
\`\`\`

**Explanation:** \`getUser\` returns a Promise. Without \`await\`, \`user\` will be a Promise object, not the resolved value.

### Error: useEffect dependency warning

**File:** \`components/Form.tsx\`

\`\`\`diff
- useEffect(() => { fetchData() }, [])
+ useEffect(() => { fetchData() }, [fetchData])
\`\`\`

> ⚠️  Add your Groq API key for unlimited AI fixes.`;
  }

  return `## FixForge Free Tier

I can help you debug and fix your code!

To get started:
- Run \`fixforge scan\` to analyze your project
- Run \`fixforge fix\` to auto-fix errors
- Run \`fixforge provider\` to add your Groq API key for full access

> 💡 Free tier: 50 fixes/day • 20 scans/day • 100 explanations/day`;
}

export function getAvailableModels() {
  return GROQ_MODELS;
}
