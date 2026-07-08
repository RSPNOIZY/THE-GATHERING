import { text, tool, type Tool, type ToolsProviderController } from "@lmstudio/sdk";
import { spawn } from "child_process";
import { rm, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { findLMStudioHome } from "./findLMStudioHome";

function getDenoPath() {
  const lmstudioHome = findLMStudioHome();
  const utilPath = join(lmstudioHome, ".internal", "utils");
  const denoPath = join(utilPath, process.platform === "win32" ? "deno.exe" : "deno");
  return denoPath;
}

export async function toolsProvider(ctl: ToolsProviderController) {
  const tools: Tool[] = [];

  const createFileTool = tool({
    name: "run_javascript",
    description: text`
      Run a JavaScript code snippet using deno. You cannot import external modules but you have 
      read/write access to the current working directory.

      Pass the code you wish to run as a string in the 'javascript' parameter.

      By default, the code will timeout in 5 seconds. You can extend this timeout by setting the
      'timeout_seconds' parameter to a higher value in seconds, up to a maximum of 60 seconds.

      You will get the stdout and stderr output of the code execution, thus please print the output
      you wish to return using 'console.log' or 'console.error'.
    `,
    parameters: { javascript: z.string(), timeout_seconds: z.number().optional() },
    implementation: async ({ javascript, timeout_seconds }) => {
      const workingDirectory = ctl.getWorkingDirectory();
      const scriptFileName = `temp_script_${Date.now()}.ts`;
      const scriptFilePath = join(workingDirectory, scriptFileName);
      await writeFile(scriptFilePath, javascript, "utf-8");

      const childProcess = spawn(
        getDenoPath(),
        [
          "run",
          "--allow-read=.",
          "--allow-write=.",
          "--no-prompt",
          "--deny-net",
          "--deny-env",
          "--deny-sys",
          "--deny-run",
          "--deny-ffi",
          scriptFilePath,
        ],
        {
          cwd: workingDirectory,
          timeout: (timeout_seconds ?? 5) * 1000, // Convert seconds to milliseconds
          stdio: "pipe",
          env: {
            NO_COLOR: "true", // Disable color output in Deno
          },
        },
      );

      let stdout = "";
      let stderr = "";

      childProcess.stdout.setEncoding("utf-8");
      childProcess.stderr.setEncoding("utf-8");

      childProcess.stdout.on("data", data => {
        stdout += data;
      });
      childProcess.stderr.on("data", data => {
        stderr += data;
      });

      await new Promise<void>((resolve, reject) => {
        childProcess.on("close", code => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process exited with code ${code}. Stderr: ${stderr}`));
          }
        });

        childProcess.on("error", err => {
          reject(err);
        });
      });

      await rm(scriptFilePath);

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };
    },
  });
  tools.push(createFileTool);

  return tools;
}
