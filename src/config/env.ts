import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  LINE_CHANNEL_SECRET: z.string().min(1),
  DEMO_MODE: z.enum(["true", "false"]).transform((v) => v === "true"),
  MONTHLY_MESSAGE_QUOTA: z.coerce.number(),
});
