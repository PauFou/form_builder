import { z } from "zod";

export const FormSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export type Form = z.infer<typeof FormSchema>;