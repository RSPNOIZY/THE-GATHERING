import { z } from "zod";

export const LineageEventSchema = z.object({
  event: z.enum([
    "created",
    "transcribed",
    "cleaned",
    "blessed",
    "locked",
    "archived",
    "consent_revoked",
  ]),
  actor: z.string().min(1),
  timestamp: z.string().datetime(),
  detail: z.string().optional(),
  sha256_before: z.string().optional(),
  sha256_after: z.string().optional(),
});

export const LineageSchema = z.object({
  session_id: z.string().min(1),
  chain: z.array(LineageEventSchema).min(1),
});

export type Lineage = z.infer<typeof LineageSchema>;
export type LineageEvent = z.infer<typeof LineageEventSchema>;
