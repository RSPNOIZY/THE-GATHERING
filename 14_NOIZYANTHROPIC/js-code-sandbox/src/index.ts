import { type PluginContext } from "@lmstudio/sdk";
import { toolsProvider } from "./toolsProvider";

export async function main(context: PluginContext) {
  // Register the tools provider.
  context.withToolsProvider(toolsProvider);
}
