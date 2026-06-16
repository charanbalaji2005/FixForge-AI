# ⚡ FixForge — AI Terminal Code Debugger

> AI-powered debugging & code fixing CLI using Groq LLM. Built with Bun.

```
  ███████╗██╗██╗  ██╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔════╝██║╚██╗██╔╝██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  █████╗  ██║ ╚███╔╝ █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
  ██╔══╝  ██║ ██╔██╗ ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
  ██║     ██║██╔╝ ██╗██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

## 🚀 Installation

```bash
# With Bun (recommended)
bun add -g fixforge

# With npm
npm install -g fixforge
```

## ⚡ Quick Start

```bash
# Launch interactive menu
fixforge

# Direct commands
fixforge scan       # Analyze your project
fixforge fix        # Auto-fix errors
fixforge explain    # Explain an error
fixforge security   # Security audit
fixforge doctor     # Full health check
fixforge chat       # Chat with AI about your code
```

## 🔑 API Key Setup

FixForge works in two modes:

### Free Tier (no key needed)
```bash
fixforge
# Select "Configure Provider" → "Free Tier"
```
- 50 fixes/day
- 20 scans/day  
- 100 explanations/day

### Custom Groq Key (unlimited)
1. Get a free key at [console.groq.com](https://console.groq.com)
2. Run:
```bash
fixforge provider
```
3. Choose "Custom Groq API Key" and paste your `gsk_...` key

Config saved to: `~/.fixforge/config.json`

## 🤖 Supported Groq Models

| Model | Speed | Best For |
|-------|-------|----------|
| Llama 3.3 70B Versatile | Fast | General use (recommended) |
| Llama 3.1 8B Instant | Ultra-fast | Quick fixes |
| DeepSeek R1 Distill 70B | Medium | Complex reasoning |
| Qwen QwQ 32B | Medium | Deep analysis |
| Mixtral 8x7B | Fast | Code generation |
| Gemma2 9B | Fast | Lightweight tasks |

## 📋 Commands

| Command | Description |
|---------|-------------|
| `fixforge scan` | Analyze project structure & architecture |
| `fixforge fix` | Detect and auto-fix code errors |
| `fixforge explain` | Explain any error in plain English |
| `fixforge security` | Audit for SQL injection, XSS, secrets, etc. |
| `fixforge review` | Score architecture (0-100) |
| `fixforge refactor` | Get refactoring suggestions |
| `fixforge watch` | Monitor `bun run dev` for errors live |
| `fixforge doctor` | Full health check with score |
| `fixforge chat` | Interactive AI chat about your codebase |
| `fixforge provider` | Configure API key and model |

## 🏗️ Project Structure

```
src/
├── index.ts          # Main entry point & CLI
├── commands/         # Command implementations
│   ├── scan.ts
│   ├── fix.ts
│   ├── explain.ts
│   ├── security.ts
│   ├── review.ts
│   ├── refactor.ts
│   ├── watch.ts
│   ├── doctor.ts
│   ├── chat.ts
│   └── provider.ts
├── providers/
│   └── groq.ts       # Groq API integration
├── scanner/
│   └── index.ts      # Project file scanner
├── prompts/
│   └── index.ts      # AI system prompts
├── config/
│   └── index.ts      # Config management
├── ui/
│   └── index.ts      # Terminal UI utilities
└── types/
    └── index.ts      # TypeScript types
```

## 🔒 Privacy

- API keys stored locally in `~/.fixforge/config.json`
- No data sent to FixForge servers
- Code analyzed locally, only sent to Groq/your chosen provider
- No accounts, no tracking

## License

MIT
