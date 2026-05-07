import { z } from 'zod';

export const listServicesSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const serviceIdParamSchema = z.object({
  id: z.string().min(1, 'Service ID is required'),
});

export type ListServicesInput = z.infer<typeof listServicesSchema>;
