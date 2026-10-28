import z from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
});

export const env = schema.parse(process.env);
