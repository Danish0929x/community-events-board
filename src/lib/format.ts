// All events happen in India, so dates are always shown in IST regardless of the
// viewer's device time zone. This also keeps server and client output identical.
const TIME_ZONE = "Asia/Kolkata";

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 150000 -> "₹1,50,000", 0 -> "Free" */
export function formatPrice(rupees: number): string {
  return rupees === 0 ? "Free" : priceFormatter.format(rupees);
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "2026-10-18T13:00:00Z" -> "Sun, 18 Oct, 6:30 PM" */
export function formatEventDate(iso: string): string {
  const parts = Object.fromEntries(dateFormatter.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.weekday}, ${parts.day} ${parts.month}, ${parts.hour}:${parts.minute} ${parts.dayPeriod.toUpperCase()}`;
}

const badgeFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "short" });

/** Calendar-style badge parts: { day: "18", month: "Oct" } */
export function formatDateBadge(iso: string): { day: string; month: string } {
  const parts = Object.fromEntries(badgeFormatter.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return { day: parts.day, month: parts.month };
}

/** Value for <input type="datetime-local"> -> ISO string with the IST offset. */
export function localInputToIso(value: string): string {
  return `${value}:00+05:30`;
}
