import { z } from "zod";

export const ConsentScopeSchema = z.enum([
  "speech_to_text",
  "voice_clone",
  "likeness",
  "distribution",
  "archival",
]);

export const SubjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["creator", "collaborator", "guest", "minor"]),
  consent: z.object({
    granted: z.boolean(),
    scopes: z.array(ConsentScopeSchema),
    granted_at: z.string().datetime(),
    revoked_at: z.string().datetime().optional(),
  }),
  guardian_id: z.string().optional(),
});

export type Subject = z.infer<typeof SubjectSchema>;
export type ConsentScope = z.infer<typeof ConsentScopeSchema>;
