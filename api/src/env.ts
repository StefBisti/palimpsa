import z from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  COOKIE_SECURE: z.stringbool(),
});

export const env = schema.parse(process.env);
