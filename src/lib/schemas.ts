import { z } from "zod";
import { CARD_THEME_IDS, CATEGORIES, DEFAULT_PAGE_SIZE, MAX_STICKERS, STICKER_IDS } from "./constants";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

// Query-string filters: "" (e.g. "?city=") is treated the same as not sending the filter.
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = z.preprocess(blankToUndefined, z.string().trim().max(100).optional());

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE);

export const eventFiltersSchema = z.object({
  category: z.preprocess(blankToUndefined, z.enum(CATEGORIES).optional()),
  city: optionalText,
  q: optionalText,
  page,
  pageSize,
});

export const paginationSchema = z.object({ page, pageSize });

export const favouritesSchema = z.object({
  categories: z.array(z.enum(CATEGORIES)).max(CATEGORIES.length),
});

export const cardDesignSchema = z.object({
  theme: z.enum(CARD_THEME_IDS),
  stickers: z
    .array(z.enum(STICKER_IDS))
    .max(MAX_STICKERS, `You can add up to ${MAX_STICKERS} stickers`)
    .refine((list) => new Set(list).size === list.length, "Each sticker can be added once"),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  category: z.enum(CATEGORIES),
  city: z.string().trim().min(2, "City is required").max(60),
  // ISO 8601 with an offset, e.g. "2026-10-18T18:30:00+05:30"
  startsAt: z.iso
    .datetime({ offset: true, error: "Enter a valid date and time" })
    .transform((v) => new Date(v))
    .refine((d) => d.getTime() > Date.now(), "Date must be in the future"),
  price: z.coerce.number().int("Price must be a whole number of rupees").min(0).max(10_000_000),
  description: z.string().trim().min(10, "Description is too short").max(2000),
  imageUrl: z.url({ protocol: /^https?$/, error: "Enter a valid http(s) image URL" }),
  isActive: z.boolean().default(true),
});

export const updateEventStatusSchema = z.object({ isActive: z.boolean() });
