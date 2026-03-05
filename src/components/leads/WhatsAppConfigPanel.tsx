import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  ExternalLink,
  Settings2,
  AlertTriangle,
  Phone,
  FileText,
  UserPlus,
  Wifi,
  WifiOff,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLeadMessages } from "@/hooks/useFinanceQueries";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useOrg } from "@/providers/OrgProvider";

interface WhatsAppConfigPanelProps {
  selectedLeadId?: string | null;
  selectedLead?: any;
}

export function WhatsAppConfigPanel({ selectedLeadId, selectedLead }: WhatsAppConfigPanelProps) {
  const { activeOrgId } = useOrg();
  const { data: messages = [] } = useLeadMessages(selectedLeadId || "");
  const [apiStatus, setApiStatus] = useState<"unknown" | "checking" | "connected" | "error">("unknown");

  const browserSnippet = useMemo(
    () => `(() => {
  const WHATSAPP_URL = "https://web.whatsapp.com";
  const CHAT_SELECTOR = '[data-testid="cell-frame-container"]';
  const SCAN_INTERVAL_MS = 3000;

  const state = {
    data: [],
    seen: new Set(),
    observer: null,
    interval: null,
  };

  function log(...args) {
    console.log("[WA-Collector]", ...args);
  }

  function normalizeDigits(v) {
    if (!v) return "";
    return String(v).replace(/\\D+/g, "");
  }

  function last12Digits(v) {
    const d = normalizeDigits(v);
    return d.length > 12 ? d.slice(-12) : d;
  }

  function getNameFromCell(cell) {
    const imgAlt = cell.querySelector("img[alt]")?.getAttribute("alt")?.trim();
    if (imgAlt) return imgAlt;

    const byClass = cell.querySelector("span._21nHd")?.textContent?.trim();
    if (byClass) return byClass;

    const genericSpan = [...cell.querySelectorAll("span")]
      .map((s) => s.textContent?.trim())
      .find((t) => t && t.length > 0);
    return genericSpan || "Sem nome";
  }

  function getNumberFromCell(cell) {
    const spanWithTitle = cell.querySelector("span[title]")?.getAttribute("title")?.trim();
    const titleDigits = normalizeDigits(spanWithTitle);
    if (titleDigits) return titleDigits;

    const dataId =
      cell.getAttribute("data-id") ||
      cell.dataset?.id ||
      cell.querySelector("[data-id]")?.getAttribute("data-id") ||
      "";
    const fromDataId = last12Digits(dataId);
    if (fromDataId) return fromDataId;

    const cellText = cell.textContent || "";
    const textDigits = normalizeDigits(cellText);
    if (textDigits.length >= 8) return last12Digits(textDigits);

    return "desconhecido";
  }

  function addIfNew(nome, numero, source = "scan") {
    const key = \`\${nome}::\${numero}\`;
    if (state.seen.has(key)) return;
    state.seen.add(key);

    const obj = { nome, numero };
    state.data.push(obj);
    log(\`Novo contato [\${source}] ->\`, obj);
  }

  function scanVisibleChats(source = "scan") {
    const cells = document.querySelectorAll(CHAT_SELECTOR);
    if (!cells.length) return;

    cells.forEach((cell) => {
      const nome = getNameFromCell(cell);
      const numero = getNumberFromCell(cell);
      addIfNew(nome, numero, source);
    });
  }

  function installMutationObserver() {
    const root =
      document.querySelector("#pane-side") ||
      document.querySelector("[data-testid='chat-list']") ||
      document.body;

    if (!root) {
      log("Root não encontrado para MutationObserver.");
      return;
    }

    if (state.observer) state.observer.disconnect();

    state.observer = new MutationObserver(() => {
      scanVisibleChats("mutation");
    });

    state.observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    log("MutationObserver ativo.");
  }

  function startCollector() {
    if (window.__waContactsCollector?.running) {
      log("Coletor já está em execução.");
      return;
    }

    installMutationObserver();
    scanVisibleChats("initial");

    state.interval = setInterval(() => {
      scanVisibleChats("interval");
    }, SCAN_INTERVAL_MS);

    window.__waContactsCollector = {
      running: true,
      data: state.data,
      stop() {
        if (state.observer) state.observer.disconnect();
        if (state.interval) clearInterval(state.interval);
        window.__waContactsCollector.running = false;
        log("Coletor parado. Total:", state.data.length);
      },
      rescan() {
        scanVisibleChats("manual");
        return state.data;
      },
      export() {
        return JSON.parse(JSON.stringify(state.data));
      },
    };

    log("Coletor iniciado. Novos contatos aparecerão em tempo real no console.");
  }

  function waitForWhatsAppAndStart() {
    const isWhatsApp = location.hostname === "web.whatsapp.com";
    if (!isWhatsApp) {
      log("Abrindo WhatsApp Web em nova aba...");
      window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
      log("Execute este mesmo snippet no console da aba do WhatsApp Web.");
      return;
    }

    const ready = () =>
      document.readyState === "complete" &&
      (document.querySelector(CHAT_SELECTOR) ||
        document.querySelector("#pane-side") ||
        document.querySelector("[data-testid='chat-list']"));

    if (ready()) {
      startCollector();
      return;
    }

    log("Aguardando carregamento completo do WhatsApp Web...");
    const bootObserver = new MutationObserver(() => {
      if (ready()) {
        bootObserver.disconnect();
        startCollector();
      }
    });

    bootObserver.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  waitForWhatsAppAndStart();
})();`,
    []
  );

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(browserSnippet);
      toast.success("Snippet copiado para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
    }
  }

  async function checkApiStatus() {
    setApiStatus("checking");
    try {
      const { error } = await supabase.functions.invoke("wa-send-message", {
        body: { lead_id: "test", text: "ping", dry_run: true },
      });
      setApiStatus(error ? "error" : "connected");
    } catch {
      setApiStatus("error");
    }
  }

  async function exportToContact(msg: any) {
    if (!activeOrgId || !selectedLead) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await supabase.from("contacts").insert({
      organization_id: activeOrgId,
      created_by: user.id,
      name: selectedLead.contractor_name || "Contato WhatsApp",
      phone: selectedLead.contact_phone || null,
      notes: `Importado do WhatsApp: "${msg.message_text?.substring(0, 100)}"`,
    });

    if (error) {
      toast.error("Erro ao exportar contato", { description: error.message });
    } else {
      toast.success("Contato exportado com sucesso!");
    }
  }

  async function generateContract(msg: any) {
    if (!activeOrgId || !selectedLeadId) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await supabase.from("contracts").insert({
      organization_id: activeOrgId,
      created_by: user.id,
      lead_id: selectedLeadId,
      fee: selectedLead?.fee || 0,
      status: "pending",
    });

    if (error) {
      toast.error("Erro ao gerar contrato", { description: error.message });
    } else {
      toast.success("Contrato gerado com sucesso!");
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* API Status Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            WhatsApp Web
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                apiStatus === "connected"
                  ? "border-green-500 text-green-600"
                  : apiStatus === "error"
                  ? "border-destructive text-destructive"
                  : "border-muted-foreground text-muted-foreground"
              }
            >
              {apiStatus === "connected" ? (
                <><Wifi className="h-3 w-3 mr-1" /> API Conectada</>
              ) : apiStatus === "error" ? (
                <><WifiOff className="h-3 w-3 mr-1" /> API Desconectada</>
              ) : apiStatus === "checking" ? (
                "Verificando..."
              ) : (
                "Status desconhecido"
              )}
            </Badge>
            <Button size="sm" variant="outline" onClick={checkApiStatus}>
              <Settings2 className="h-3 w-3 mr-1" /> Testar
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => window.open("https://web.whatsapp.com", "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
            Abrir WhatsApp Web
          </Button>
          {selectedLead?.contact_phone && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                window.open(
                  `https://wa.me/${selectedLead.contact_phone.replace(/\D/g, "")}`,
                  "_blank"
                )
              }
            >
              <Phone className="h-3 w-3" />
              Conversar com {selectedLead.contractor_name}
            </Button>
          )}
        </div>

        {/* Info card */}
        <Card className="p-3 bg-muted/50 border-dashed">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Modo atual:</strong> Use o WhatsApp Web em uma aba separada.
                Mensagens enviadas pela API oficial aparecem aqui automaticamente.
              </p>
              <p>
                <strong>Para ativar a API:</strong> Compre um número no Meta Business,
                configure o WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID nos secrets.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-muted/40">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-medium">Snippet para coletar contatos no WhatsApp Web (console)</p>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copySnippet}>
              <Copy className="h-3 w-3 mr-1" /> Copiar snippet
            </Button>
          </div>
          <pre className="text-[11px] bg-background border rounded-md p-2 overflow-x-auto max-h-36">
            <code>{browserSnippet}</code>
          </pre>
        </Card>
      </div>

      {/* Messages with action buttons */}
      {selectedLeadId ? (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Nenhuma mensagem capturada para este lead.</p>
                <p className="text-xs mt-1">Mensagens da API oficial aparecerão aqui.</p>
              </div>
            ) : (
              messages.map((msg: any) => {
                const isInbound = msg.direction === "inbound";
                return (
                  <div key={msg.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={isInbound ? "secondary" : "default"} className="text-[10px]">
                            {isInbound ? "Recebida" : "Enviada"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(parseISO(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                          {msg.message_text || "(sem texto)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 border-t pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => exportToContact(msg)}
                      >
                        <UserPlus className="h-3 w-3" /> Exportar Contato
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => generateContract(msg)}
                      >
                        <FileText className="h-3 w-3" /> Gerar Contrato
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4">
          Selecione um lead para ver mensagens e ações
        </div>
      )}
    </div>
  );
}
