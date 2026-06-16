import { join, extname, relative } from "path";
import type { FileInfo, ProjectContext } from "../types/index.ts";

const SCAN_DIRS = ["src", "app", "pages", "components", "hooks", "lib", "services", "utils", "db"];
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".turbo", "coverage"]);
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java"]);
const CONFIG_FILES = ["package.json", "tsconfig.json", "bunfig.toml", ".env.example", "README.md"];

const LANG_MAP: Record<string, string> = {
  ".ts": "TypeScript", ".tsx": "TypeScript React", ".js": "JavaScript",
  ".jsx": "JavaScript React", ".py": "Python", ".go": "Go",
  ".rs": "Rust", ".java": "Java", ".mjs": "ES Module",
};

async function readFilesSafe(dir: string, files: FileInfo[], maxFiles = 80): Promise<void> {
  if (files.length >= maxFiles) return;

  let entries: string[];
  try {
    const fs = await import("fs/promises");
    const dirEntries = await fs.readdir(dir, { withFileTypes: true });
    entries = dirEntries.map((e) => (e.isDirectory() ? e.name + "/" : e.name));

    for (const entry of dirEntries) {
      if (files.length >= maxFiles) break;
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          await readFilesSafe(fullPath, files, maxFiles);
        }
      } else {
        const ext = extname(entry.name);
        if (CODE_EXTS.has(ext)) {
          try {
            const bunFile = Bun.file(fullPath);
            const content = await bunFile.text();
            if (content.length < 50000) {
              files.push({
                path: fullPath,
                content,
                language: LANG_MAP[ext] || ext,
                lines: content.split("\n").length,
              });
            }
          } catch {}
        }
      }
    }
  } catch {}
}

export async function scanProject(rootDir: string): Promise<ProjectContext> {
  const files: FileInfo[] = [];
  const fs = await import("fs/promises");

  // Read config files first
  let packageJson: Record<string, unknown> | undefined;
  for (const cf of CONFIG_FILES) {
    try {
      const p = join(rootDir, cf);
      const bunFile = Bun.file(p);
      if (await bunFile.exists()) {
        const text = await bunFile.text();
        if (cf === "package.json") {
          packageJson = JSON.parse(text);
        }
        files.push({
          path: p,
          content: text,
          language: cf.endsWith(".json") ? "JSON" : "TOML",
          lines: text.split("\n").length,
        });
      }
    } catch {}
  }

  // Scan known dirs
  for (const dir of SCAN_DIRS) {
    const dirPath = join(rootDir, dir);
    try {
      await fs.access(dirPath);
      await readFilesSafe(dirPath, files);
    } catch {}
  }

  // Also scan root-level files
  await readFilesSafe(rootDir, files, 20);

  // Detect framework
  const deps = {
    ...((packageJson?.dependencies as Record<string, string>) || {}),
    ...((packageJson?.devDependencies as Record<string, string>) || {}),
  };

  let framework = "Unknown";
  if (deps.next) framework = "Next.js";
  else if (deps.react) framework = "React";
  else if (deps.vue) framework = "Vue";
  else if (deps.svelte) framework = "Svelte";
  else if (deps.express) framework = "Express";
  else if (deps.fastify) framework = "Fastify";
  else if (deps.hono) framework = "Hono";

  const hasTypeScript = files.some((f) => f.path.endsWith(".ts") || f.path.endsWith(".tsx"));

  const summary = [
    `Project: ${(packageJson?.name as string) || rootDir.split("/").pop()}`,
    `Framework: ${framework}`,
    `TypeScript: ${hasTypeScript ? "Yes" : "No"}`,
    `Files Scanned: ${files.length}`,
    `Total Lines: ${files.reduce((a, f) => a + f.lines, 0)}`,
  ].join(" | ");

  return {
    rootDir,
    files,
    packageJson,
    framework,
    hasTypeScript,
    totalFiles: files.length,
    summary,
    language: hasTypeScript ? "TypeScript" : "JavaScript",
  };
}

export function buildContextString(ctx: ProjectContext, maxChars = 6000): string {
  const limit = Math.min(maxChars, 6000);
  let out = `# Project Context\n${ctx.summary}\n\n`;
  let chars = out.length;

  for (const f of ctx.files) {
    const snippet = `## File: ${relative(ctx.rootDir, f.path)}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
    if (chars + snippet.length > limit) break;
    out += snippet;
    chars += snippet.length;
  }

  return out;
}
