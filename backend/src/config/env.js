import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1h"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(20).default(12),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = result.data;