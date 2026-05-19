import type { Item } from "@/types/item";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return url.replace(/\/$/, "");
}

export async function listItems(): Promise<Item[]> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/items`, { cache: "no-store" });
  } catch (e) {
    throw new ApiError(`백엔드 연결 실패: ${(e as Error).message}`, 0);
  }
  if (!res.ok) {
    throw new ApiError(`GET /items 실패 (${res.status})`, res.status);
  }
  return res.json();
}
