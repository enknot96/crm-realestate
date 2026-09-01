import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^[0-9-]+$/),
  email: z.email().optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  memo: z.string().optional(),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
