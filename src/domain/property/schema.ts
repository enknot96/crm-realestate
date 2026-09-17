import { z } from "zod";

export const propertyFormSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  structureType: z.string().optional(),
  floors: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === "" || /^\d+$/.test(val), {
      message: "階数は数値で入力してください",
    })
    .transform((val) => (val === undefined || val === "" ? undefined : Number(val))),
});

export type PropertyFormInput = z.infer<typeof propertyFormSchema>;
