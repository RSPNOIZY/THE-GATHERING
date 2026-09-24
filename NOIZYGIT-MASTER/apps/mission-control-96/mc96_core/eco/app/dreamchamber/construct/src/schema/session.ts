import { z } from "zod";
import { AgentSchema } from "./agent.js";
import { SubjectSchema } from "./subject.js";

export const SignalQualitySchema = z.enum(["raw", "cleaned", "enhanced", "mastered"]);

export const SessionStatusSchema = z.enum([
  "draft",
  "unlocked",
  "blessed",
  "locked",
  "archived",
]);

export const SessionMetaSchema = z.object({
  session_id: z.string().min(1),
  brand: z.string().min(1),
  title: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  status: SessionStatusSchema,
  signal_quality: SignalQualitySchema,
  confidence: z.number().min(0).max(1),
  duration_seconds: z.number().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
});

export const SessionSchema = z.object({
  meta: SessionMetaSchema,
  agents: z.array(AgentSchema).min(1),
  subjects: z.array(SubjectSchema).default([]),
  transcript: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
      timestamp: z.string().datetime(),
      confidence: z.number().min(0).max(1).optional(),
    })
  ),
  artifacts: z
    .array(
      z.object({
        type: z.enum(["audio", "text", "image", "proof"]),
        path: z.string(),
        sha256: z.string().optional(),
      })
    )
    .default([]),
});

export type Session = z.infer<typeof SessionSchema>;
export type SessionMeta = z.infer<typeof SessionMetaSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type SignalQuality = z.infer<typeof SignalQualitySchema>;
