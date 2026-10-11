// Shared by the API (validation) and the UI (labels, colours).

export const CATEGORIES = ["Music", "Workshop", "Food", "Sports", "Kids"] as const;
export type Category = (typeof CATEGORIES)[number];

export const ROLES = ["USER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const TOKEN_COOKIE = "ceb_token";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const DEFAULT_PAGE_SIZE = 6;

// "none" is a plain card; the other three are the coloured background themes.
export const CARD_THEMES = [
  {
    id: "none",
    name: "None",
    background: "bg-surface",
    text: "text-ink",
    swatch: "bg-surface",
  },
  {
    id: "sunset",
    name: "Sunset",
    background: "bg-gradient-to-br from-orange-400 via-rose-500 to-fuchsia-600",
    text: "text-white",
    swatch: "bg-gradient-to-br from-orange-400 to-fuchsia-600",
  },
  {
    id: "midnight",
    name: "Midnight",
    background: "bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-700",
    text: "text-white",
    swatch: "bg-gradient-to-br from-slate-900 to-violet-700",
  },
  {
    id: "meadow",
    name: "Meadow",
    background: "bg-gradient-to-br from-lime-200 via-emerald-200 to-sky-300",
    text: "text-slate-900",
    swatch: "bg-gradient-to-br from-lime-200 to-sky-300",
  },
] as const;
export type CardThemeId = (typeof CARD_THEMES)[number]["id"];
export const CARD_THEME_IDS = CARD_THEMES.map((t) => t.id) as [CardThemeId, ...CardThemeId[]];

export const STICKERS = [
  { id: "party", emoji: "🎉", label: "Party popper" },
  { id: "star", emoji: "⭐", label: "Star" },
  { id: "heart", emoji: "💖", label: "Heart" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "music", emoji: "🎶", label: "Music notes" },
] as const;
export type StickerId = (typeof STICKERS)[number]["id"];
export const STICKER_IDS = STICKERS.map((s) => s.id) as [StickerId, ...StickerId[]];
export const MAX_STICKERS = 3;

export const DEFAULT_CARD_DESIGN = { theme: "sunset" as CardThemeId, stickers: [] as StickerId[] };
