import { listItems, ApiError } from "@/lib/api";
import type { Item } from "@/types/item";

export const dynamic = "force-dynamic";

export default async function Page() {
  let items: Item[] | null = null;
  let errorMessage: string | null = null;

  try {
    items = await listItems();
  } catch (e) {
    errorMessage =
      e instanceof ApiError
        ? e.message
        : `예상치 못한 오류: ${(e as Error).message}`;
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-semibold">오늘</h1>

      {errorMessage && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {!errorMessage && items && items.length === 0 && (
        <p className="text-zinc-500">첫 항목을 추가해보세요</p>
      )}

      {!errorMessage && items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded border border-zinc-200 p-3">
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
