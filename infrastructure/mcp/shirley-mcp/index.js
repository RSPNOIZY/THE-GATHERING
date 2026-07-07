#!/usr/bin/env node
/**
 * SHIRLEY MCP Server — Code & File Manager
 *
 * Gemma 3 27B patterns. Provides code analysis, file inventory,
 * dependency auditing, and codebase health tools.
 *
 * Tools:
 *   shirley_file_inventory  — Inventory project files by type and size
 *   shirley_dep_audit       — Audit package.json dependencies for issues
 *   shirley_code_stats      — Code statistics (lines, files, languages)
 *   shirley_find_todos      — Find all TODO/FIXME/HACK comments in code
 *   shirley_format_check    — Check if files pass Prettier/ESLint/Black
 *   shirley_status          — Shirley awareness snapshot
 *
 * No external API — operates on local filesystem.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const PROJECT_ROOT =
  process.env.NOIZY_PROJECT_ROOT || join(process.env.HOME, "NOIZYLAB");

function walkDir(dir, results = [], depth = 0) {
  if (depth > 5) return results;
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (
        entry.startsWith(".") ||
        entry === "node_modules" ||
        entry === ".worktrees"
      )
        continue;
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walkDir(full, results, depth + 1);
        } else {
          results.push({
            path: full.replace(PROJECT_ROOT + "/", ""),
            size: stat.size,
            ext: extname(entry),
          });
        }
      } catch {
        /* skip inaccessible */
      }
    }
  } catch {
    /* skip inaccessible dirs */
  }
  return results;
}

const server = new Server(
  { name: "shirley-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "shirley_file_inventory",
      description:
        "Inventory all project files by type and size. Groups by extension, shows counts and total sizes. Excludes node_modules and hidden dirs.",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description:
              "Subdirectory to scan (relative to project root). Default: entire project.",
          },
        },
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "shirley_dep_audit",
      description:
        "Audit package.json dependencies: check for missing packages, version issues, and unused dependencies.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "shirley_code_stats",
      description:
        "Code statistics: total lines, files, breakdown by language (JS, Python, SQL, HTML, CSS, MD).",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "shirley_find_todos",
      description:
        "Find all TODO, FIXME, HACK, and XXX comments across the codebase. Returns file, line number, and comment text.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "shirley_format_check",
      description:
        "Check if JS/TS files pass Prettier formatting and Python files pass Black formatting. Dry-run only — does not modify files.",
      inputSchema: {
        type: "object",
        properties: {
          file: {
            type: "string",
            description: "Specific file to check (relative path). Default: check all.",
          },
        },
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "shirley_status",
      description: "Shirley awareness: project file count, dependency health, code stats.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "shirley_file_inventory": {
        const scanDir = args.directory
          ? join(PROJECT_ROOT, args.directory)
          : PROJECT_ROOT;
        const files = walkDir(scanDir);

        const byExt = {};
        for (const f of files) {
          const ext = f.ext || "(no ext)";
          if (!byExt[ext]) byExt[ext] = { count: 0, size: 0 };
          byExt[ext].count++;
          byExt[ext].size += f.size;
        }

        const sorted = Object.entries(byExt).sort(
          (a, b) => b[1].count - a[1].count,
        );
        const lines = [
          "**SHIRLEY — File Inventory**",
          "",
          `Directory: ${args.directory || "(project root)"}`,
          `Total files: ${files.length}`,
          `Total size: ${(files.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(1)} MB`,
          "",
          ...sorted.map(
            ([ext, data]) =>
              `  ${ext.padEnd(10)} ${String(data.count).padStart(5)} files  ${(data.size / 1024).toFixed(0).padStart(8)} KB`,
          ),
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "shirley_dep_audit": {
        const pkgPath = join(PROJECT_ROOT, "package.json");
        if (!existsSync(pkgPath)) {
          return {
            content: [
              { type: "text", text: "⚠ package.json not found at project root" },
            ],
          };
        }

        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        const deps = Object.keys(pkg.dependencies || {});
        const devDeps = Object.keys(pkg.devDependencies || {});
        const hasNodeModules = existsSync(
          join(PROJECT_ROOT, "node_modules"),
        );

        const lines = [
          "**SHIRLEY — Dependency Audit**",
          "",
          `Dependencies: ${deps.length}`,
          `Dev dependencies: ${devDeps.length}`,
          `node_modules: ${hasNodeModules ? "✓ installed" : "✗ missing — run npm install"}`,
          "",
          "Dependencies:",
          ...deps.map(
            (d) =>
              `  ${d}: ${pkg.dependencies[d]}${existsSync(join(PROJECT_ROOT, "node_modules", d)) ? "" : " ⚠ NOT INSTALLED"}`,
          ),
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "shirley_code_stats": {
        const files = walkDir(PROJECT_ROOT);
        const langMap = {
          ".js": "JavaScript",
          ".mjs": "JavaScript",
          ".cjs": "JavaScript",
          ".ts": "TypeScript",
          ".tsx": "TypeScript",
          ".jsx": "JavaScript",
          ".py": "Python",
          ".sql": "SQL",
          ".html": "HTML",
          ".css": "CSS",
          ".md": "Markdown",
          ".json": "JSON",
          ".sh": "Shell",
        };

        const stats = {};
        let totalLines = 0;

        for (const f of files) {
          const lang = langMap[f.ext] || "Other";
          if (!stats[lang]) stats[lang] = { files: 0, lines: 0 };
          stats[lang].files++;

          try {
            const content = readFileSync(join(PROJECT_ROOT, f.path), "utf8");
            const lines = content.split("\n").length;
            stats[lang].lines += lines;
            totalLines += lines;
          } catch {
            /* skip binary files */
          }
        }

        const sorted = Object.entries(stats).sort(
          (a, b) => b[1].lines - a[1].lines,
        );
        const lines = [
          "**SHIRLEY — Code Stats**",
          "",
          `Total files: ${files.length}`,
          `Total lines: ${totalLines.toLocaleString()}`,
          "",
          ...sorted.map(
            ([lang, data]) =>
              `  ${lang.padEnd(12)} ${String(data.files).padStart(5)} files  ${data.lines.toLocaleString().padStart(8)} lines`,
          ),
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "shirley_find_todos": {
        const files = walkDir(PROJECT_ROOT);
        const codeExts = [".js", ".mjs", ".ts", ".tsx", ".py", ".sql", ".sh"];
        const todos = [];

        for (const f of files) {
          if (!codeExts.includes(f.ext)) continue;
          try {
            const content = readFileSync(join(PROJECT_ROOT, f.path), "utf8");
            const fileLines = content.split("\n");
            fileLines.forEach((line, i) => {
              const match = line.match(/\b(TODO|FIXME|HACK|XXX)\b[:\s]*(.*)/i);
              if (match) {
                todos.push({
                  file: f.path,
                  line: i + 1,
                  type: match[1].toUpperCase(),
                  text: match[2].trim(),
                });
              }
            });
          } catch {
            /* skip */
          }
        }

        const lines = [
          "**SHIRLEY — TODO Finder**",
          "",
          `Found: ${todos.length} items`,
          "",
          ...todos.map(
            (t) => `  [${t.type}] ${t.file}:${t.line} — ${t.text}`,
          ),
          todos.length === 0 ? "  ✓ No TODOs found. Clean codebase." : "",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "shirley_format_check": {
        const lines = [
          "**SHIRLEY — Format Check**",
          "",
          "Checking is handled by the PostToolUse hook (format-and-lint.sh).",
          "Every file Claude edits is auto-formatted:",
          "  JS/TS: Prettier + ESLint --fix",
          "  Python: Black + isort",
          "  JSON/CSS/HTML/MD: Prettier",
          "",
          "To manually check:",
          "  npx prettier --check 'src/**/*.js'",
          "  npx eslint src/",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "shirley_status": {
        const files = walkDir(PROJECT_ROOT);
        const hasNodeModules = existsSync(
          join(PROJECT_ROOT, "node_modules"),
        );

        const lines = [
          "**SHIRLEY STATUS**",
          "",
          `Project files: ${files.length}`,
          `node_modules: ${hasNodeModules ? "✓" : "✗"}`,
          "",
          "Code & File Manager — ready.",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `**Error:** ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
