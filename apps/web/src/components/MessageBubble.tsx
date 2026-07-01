export default function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-2xl whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
          isUser ? "bg-apex-gold text-black" : "bg-neutral-900 text-neutral-100"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
