import { z } from 'zod'
import { RFQ_DEFAULT_COUNTRY } from '@/lib/constants'

export const rfqSchema = z.object({
  part_number: z.string().trim().min(1).max(50),
  quantity: z.coerce.number().int().min(1).max(99999),
  email: z.string().trim().email(),
  company: z.string().trim().max(100).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  contact_name: z.string().trim().min(1).max(120).default('Customer'),
  country: z.string().trim().min(2).max(80).default(RFQ_DEFAULT_COUNTRY),
})

export const productFilterSchema = z.object({
  brand_id: z.coerce.number().int().positive().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  size: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().max(200).optional(),
})

export const searchSchema = z.object({
  query: z.string().trim().min(2).max(200),
})
