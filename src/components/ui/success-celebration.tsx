import { useEffect, useState } from "react";
import { CheckCircle2, PartyPopper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessCelebrationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}

export function SuccessCelebration({
  show,
  message = "Sucesso!",
  onComplete,
}: SuccessCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* Confetti effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          >
            <Sparkles
              className={cn(
                "h-4 w-4",
                i % 3 === 0
                  ? "text-status-negotiation"
                  : i % 3 === 1
                  ? "text-primary"
                  : "text-status-confirmed"
              )}
            />
          </div>
        ))}
      </div>

      {/* Center message */}
      <div className="relative animate-scale-in bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-8 w-8 text-status-negotiation animate-bounce" />
            <CheckCircle2 className="h-12 w-12 text-status-confirmed" />
            <PartyPopper className="h-8 w-8 text-status-negotiation animate-bounce" style={{ animationDelay: "0.1s" }} />
          </div>
          <span className="text-xl font-bold text-foreground">{message}</span>
        </div>
      </div>
    </div>
  );
}
