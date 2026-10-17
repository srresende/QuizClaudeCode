import "server-only";
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Validated lazily so `next build` works without runtime secrets. */
export function getEnv(): Env {
  if (!cached) {
    const result = envSchema.safeParse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    if (!result.success) {
      // A plain Error (not ZodError) so it surfaces as a 500, not as invalid client input.
      throw new Error(`Invalid server environment: ${z.prettifyError(result.error)}`);
    }
    cached = result.data;
  }
  return cached;
}
