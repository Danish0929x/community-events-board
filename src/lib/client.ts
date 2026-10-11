// Browser-side helpers for calling our own JSON API.
import type { Category, Role } from "./constants";
import type { EventDto, Paginated } from "./events";

export type { EventDto, Paginated };
export type SessionUser = { id: string; email: string; role: Role };
export type Session = { user: SessionUser; favourites: Category[] };

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  /** Let the request finish even if the user refreshes or leaves the page right after. */
  keepalive?: boolean;
};

export async function api<T>(path: string, init: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? "GET",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
      keepalive: init.keepalive,
      cache: "no-store",
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiClientError(0, "Can't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiClientError(res.status, (data as { error?: string } | null)?.error ?? "Something went wrong");
  }
  return data as T;
}
