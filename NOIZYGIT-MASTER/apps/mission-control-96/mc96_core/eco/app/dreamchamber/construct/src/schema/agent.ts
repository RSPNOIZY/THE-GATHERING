import { z } from "zod";

export const AgentRoleSchema = z.enum([
  "interviewer",
  "witness",
  "analyst",
  "scribe",
  "guardian",
]);

export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: AgentRoleSchema,
  model: z.string().default("claude-opus-4-6"),
  voice: z.string().optional(),
  brand: z.string().min(1),
  version: z.string().default("1.0.0"),
});

export type Agent = z.infer<typeof AgentSchema>;
export type AgentRole = z.infer<typeof AgentRoleSchema>;
