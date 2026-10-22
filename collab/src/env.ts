import z from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive(),
});

export const env = schema.parse(process.env);
