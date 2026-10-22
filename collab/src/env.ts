import z from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.url(),
});

export const env = schema.parse(process.env);
