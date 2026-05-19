"use client";

import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

export default function Page() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text, done: false },
    ]);
    setInput("");
  }

  function toggleTodo(id: number) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  function deleteTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-semibold">오늘</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTodo();
          }}
          placeholder="할 일을 입력하세요"
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        <button
          type="button"
          onClick={addTodo}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
          disabled={!input.trim()}
        >
          추가
        </button>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-zinc-500">첫 항목을 추가해보세요</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded border border-zinc-200 p-3"
            >
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                className="h-4 w-4"
              />
              <span
                className={`flex-1 text-sm ${
                  todo.done ? "text-zinc-400 line-through" : "text-zinc-900"
                }`}
              >
                {todo.text}
              </span>
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                className="text-sm text-zinc-400 hover:text-red-600"
                aria-label="삭제"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
