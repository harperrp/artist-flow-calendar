import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: "show" | "contract" | "lead" | "alert";
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
}

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "show",
    title: "Show confirmado",
    description: "Prefeitura de Januária confirmou o show para 15/03",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false,
  },
  {
    id: "2",
    type: "contract",
    title: "Contrato pendente",
    description: "Contrato de Casa de Show BH aguarda assinatura",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
  {
    id: "3",
    type: "lead",
    title: "Novo lead recebido",
    description: "Festival de Verão RJ entrou em contato",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
  },
  {
    id: "4",
    type: "alert",
    title: "Negociação parada",
    description: "Lead Prefeitura de Uberlândia sem atualização há 7 dias",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
];

const iconMap = {
  show: { icon: Calendar, color: "text-green-500 bg-green-50" },
  contract: { icon: FileText, color: "text-blue-500 bg-blue-50" },
  lead: { icon: CheckCircle, color: "text-yellow-500 bg-yellow-50" },
  alert: { icon: AlertCircle, color: "text-red-500 bg-red-50" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="font-semibold">Notificações</div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={markAllRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const { icon: Icon, color } = iconMap[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`flex gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full text-sm">
            Ver todas as notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
