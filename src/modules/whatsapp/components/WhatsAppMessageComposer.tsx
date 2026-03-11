import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
}

export function WhatsAppMessageComposer({ onSend, disabled, loading }: Props) {
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    await onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite sua mensagem..."
        disabled={disabled || loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <Button onClick={() => void submit()} disabled={disabled || loading || !text.trim()}>
        {loading ? "Enviando..." : "Enviar"}
      </Button>
    </div>
  );
}
