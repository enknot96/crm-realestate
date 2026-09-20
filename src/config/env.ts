import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  LINE_CHANNEL_SECRET: z.string().min(1),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().min(1),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  IMAGE_SIGNING_SECRET: z.string().min(1),
  IMAGE_DELIVERY_BASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  NOTIFY_EMAIL_TO: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  DEMO_MODE: z.enum(["true", "false"]).transform((v) => v === "true"),
  MONTHLY_MESSAGE_QUOTA: z.coerce.number().positive(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errorMessages = result.error.issues.map(
    (issue) => `${String(issue.path[0])}: ${issue.message}`,
  );
  console.error(errorMessages.join("\n"));
  process.exit(1);
}

export const env = result.data;
