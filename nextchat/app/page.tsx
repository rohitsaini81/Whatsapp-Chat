"use client";

import { useEffect, useId, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type ChatMessage = {
  name: string;
  message: string;
  fileData: string | null;
  fileName: string | null;
  own: boolean;
};

let socket: Socket | null = null;

export default function Home() {
  const id = useId().replaceAll(":", "");
  const name = `user${id.slice(-4) || "0000"}`;
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket = io();

    socket.on("chat", (msg: Omit<ChatMessage, "own">) => {
      setMessages((prev) => [...prev, { ...msg, own: false }]);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const fileToBase64 = (selectedFile: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read file"));
    });

  const sendMessage = async () => {
    if (!text.trim() && !file) return;

    const msg: Omit<ChatMessage, "own"> = {
      name,
      message: text,
      fileData: null,
      fileName: null,
    };

    if (file) {
      msg.fileData = await fileToBase64(file);
      msg.fileName = file.name;
    }

    socket?.emit("chat-message", msg);
    setMessages((prev) => [...prev, { ...msg, own: true }]);
    setText("");
    setFile(null);

    const fileInput = document.getElementById("file") as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <section className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/90 shadow-2xl shadow-black/40 md:h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between border-b border-slate-700/70 bg-slate-800/80 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Realtime room</p>
            <h1 className="text-lg font-semibold text-slate-100 md:text-xl">NextJS Chat</h1>
          </div>
          <div className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-cyan-300">
            {name}
          </div>
        </header>

        <div ref={chatRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-900/70 p-4 md:p-5">
          {messages.map((msg, index) => (
            <article
              key={`${msg.name}-${index}`}
              className={`max-w-[88%] rounded-2xl border px-3 py-2 text-sm leading-relaxed shadow-lg md:max-w-[72%] md:px-4 md:py-3 ${
                msg.own
                  ? "ml-auto border-cyan-400/30 bg-cyan-500/20 text-cyan-50"
                  : "mr-auto border-slate-600 bg-slate-800/90 text-slate-100"
              }`}
            >
              <p className={`mb-1 text-[11px] font-semibold ${msg.own ? "text-cyan-200" : "text-slate-400"}`}>
                {msg.name}
              </p>
              {msg.message ? <p>{msg.message}</p> : null}

              {msg.fileData && msg.fileName ? (
                <a
                  href={msg.fileData}
                  download={msg.fileName}
                  className={`mt-2 inline-flex w-fit rounded-lg border px-2 py-1 text-xs font-medium transition ${
                    msg.own
                      ? "border-cyan-300/50 bg-cyan-100/15 text-cyan-50 hover:bg-cyan-100/25"
                      : "border-slate-500 bg-slate-700 text-slate-100 hover:bg-slate-600"
                  }`}
                >
                  Download {msg.fileName}
                </a>
              ) : null}
            </article>
          ))}
        </div>

        <div className="grid gap-2 border-t border-slate-700/70 bg-slate-800/80 p-3 md:grid-cols-[1fr_auto_auto] md:gap-3 md:p-4">
          <input
            id="text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400/60 placeholder:text-slate-500 focus:ring-2"
          />

          <input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full max-w-full cursor-pointer rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-300 file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-700 file:px-2 file:py-1 file:text-slate-200 hover:file:bg-slate-600 md:max-w-64"
          />

          <button
            onClick={() => void sendMessage()}
            className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-400"
          >
            Send
          </button>
        </div>
      </section>
    </main>
  );
}
