import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execFileP = promisify(execFile);

async function sh(args: string[], input?: string, timeoutMs = 60_000): Promise<string> {
  try {
    const child = execFileP("shortcuts", args, {
      timeout: timeoutMs,
      maxBuffer: 8 * 1024 * 1024,
      input,
    } as any);
    const { stdout } = await child;
    return stdout.toString().trim();
  } catch (err: any) {
    const stderr = (err?.stderr ?? "").toString().trim();
    throw new Error(stderr || err?.message || String(err));
  }
}

export const shortcutsTools = [
  {
    name: "shortcut_list",
    description:
      "List all macOS Shortcuts available on this Mac. Returns the names you can pass to shortcut_run.",
    inputSchema: z.object({
      folder: z.string().optional().describe("Optional folder name to filter by"),
    }),
    handler: async ({ folder }: { folder?: string }) => {
      const args = ["list"];
      if (folder) args.push("--folder-name", folder);
      const out = await sh(args);
      const shortcuts = out
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      return { count: shortcuts.length, shortcuts };
    },
  },
  {
    name: "shortcut_list_folders",
    description: "List all Shortcut folders on this Mac.",
    inputSchema: z.object({}),
    handler: async () => {
      const out = await sh(["list", "--folders"]);
      const folders = out
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      return { count: folders.length, folders };
    },
  },
  {
    name: "shortcut_run",
    description:
      "Run a macOS Shortcut by name. Optionally pass text input. Returns the shortcut's output if any.",
    inputSchema: z.object({
      name: z.string().describe("Exact name of the shortcut as shown in the Shortcuts app"),
      input: z.string().optional().describe("Optional text input piped to the shortcut"),
    }),
    handler: async ({ name, input }: { name: string; input?: string }) => {
      const args = ["run", name];
      if (input !== undefined) {
        args.push("--input-path", "-");
      }
      const output = await sh(args, input);
      return { name, ran: true, output };
    },
  },
  {
    name: "shortcut_view",
    description: "Open a shortcut in the Shortcuts app for editing.",
    inputSchema: z.object({ name: z.string() }),
    handler: async ({ name }: { name: string }) => {
      await sh(["view", name]);
      return { name, opened: true };
    },
  },
];
