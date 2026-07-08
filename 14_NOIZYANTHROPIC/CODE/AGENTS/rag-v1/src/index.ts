import { type PluginContext } from "@lmstudio/sdk";
import { configSchematics } from "./config";
import { preprocess } from "./promptPreprocessor";

// This is the entry point of the plugin. The main function is to register different components of
// the plugin, such as promptPreprocessor, predictionLoopHandler, etc.
//
// You do not need to modify this file unless you want to add more components to the plugin, and/or
// add custom initialization logic.

export async function main(context: PluginContext) {
  // Register the configuration schematics.
  context.withConfigSchematics(configSchematics);
  // Register the promptPreprocessor.
  context.withPromptPreprocessor(preprocess);
}
