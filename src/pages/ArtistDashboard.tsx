import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/providers/OrgProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCalendarEvents } from "@/hooks/useCrmQueries";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { format, parseISO, isFuture, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  ListChecks,
  Bell,
  Music,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

export function ArtistDashboardPage() {
  const { activeOrgId, profile } = useOrg();
  const { user } = useAuth();
  const { data: events = [] } = useCalendarEvents(activeOrgId);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();

  const { data: myTasks = [] } = useQuery({
    queryKey: ["artist-tasks", activeOrgId, user?.id],
    enabled: !!activeOrgId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("tasks")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .eq("assigned_to", user!.id)
        .eq("is_completed", false)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const upcomingEvents = events
    .filter((e: any) => e.status === "confirmed" && isFuture(parseISO(e.start_time)))
    .sort((a: any, b: any) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
    .slice(0, 10);

  const pastEvents = events
    .filter((e: any) => e.status === "confirmed" && isPast(parseISO(e.start_time)) && !isToday(parseISO(e.start_time)))
    .sort((a: any, b: any) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime())
    .slice(0, 5);

  const unreadNotifications = notifications.filter((n: any) => !n.is_read);

  return (
    <div className="space-y-6 fade-up">
      {/* Welcome Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Music className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {profile?.display_name || "Artista"}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Seu painel de atividades e agenda
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{upcomingEvents.length}</p>
            <p className="text-xs text-muted-foreground">Shows agendados</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-yellow-500/10 p-2">
            <ListChecks className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{myTasks.length}</p>
            <p className="text-xs text-muted-foreground">Tarefas pendentes</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-destructive/10 p-2">
            <Bell className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{unreadNotifications.length}</p>
            <p className="text-xs text-muted-foreground">Recados novos</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-500/10 p-2">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {formatMoneyBRL(upcomingEvents.reduce((s: number, e: any) => s + (e.fee || 0), 0))}
            </p>
            <p className="text-xs text-muted-foreground">Receita prevista</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Shows */}
        <Card className="lg:col-span-2 border bg-card/70">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Próximos Shows
            </h2>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum show agendado no momento
              </div>
            ) : (
              upcomingEvents.map((e: any) => (
                <div key={e.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="text-center min-w-[50px]">
                    <div className="text-2xl font-bold text-primary">
                      {format(parseISO(e.start_time), "dd")}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(parseISO(e.start_time), "MMM", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{e.title}</div>
                    {(e.city || e.venue_name) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {[e.venue_name, e.city, e.state].filter(Boolean).join(" — ")}
                      </div>
                    )}
                  </div>
                  {e.fee && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0">
                      {formatMoneyBRL(e.fee)}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Notifications / Messages */}
        <Card className="border bg-card/70">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-destructive" />
              Recados
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadNotifications.length}</Badge>
              )}
            </h2>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum recado ainda
              </div>
            ) : (
              notifications.slice(0, 15).map((n: any) => (
                <div
                  key={n.id}
                  className={`p-3 cursor-pointer hover:bg-muted/30 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{n.title}</span>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(n.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Tasks */}
      <Card className="border bg-card/70">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-yellow-600" />
            Minhas Tarefas
          </h2>
        </div>
        <div className="divide-y max-h-[350px] overflow-y-auto">
          {myTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma tarefa atribuída a você 🎉
            </div>
          ) : (
            myTasks.map((t: any) => {
              const overdue = t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date));
              return (
                <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className={`h-2 w-2 rounded-full ${overdue ? "bg-destructive" : t.priority === "high" ? "bg-yellow-500" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{t.title}</div>
                    {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                  </div>
                  {t.due_date && (
                    <span className={`text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {format(new Date(t.due_date), "dd/MM", { locale: ptBR })}
                      {overdue && " ⚠️"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Recent Shows */}
      {pastEvents.length > 0 && (
        <Card className="border bg-card/70">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Shows Recentes
            </h2>
          </div>
          <div className="divide-y">
            {pastEvents.map((e: any) => (
              <div key={e.id} className="flex items-center gap-4 p-4">
                <div className="text-center min-w-[50px] opacity-60">
                  <div className="text-lg font-bold">{format(parseISO(e.start_time), "dd")}</div>
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(parseISO(e.start_time), "MMM", { locale: ptBR })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-muted-foreground">{e.title}</div>
                  {e.city && (
                    <div className="text-xs text-muted-foreground">
                      {[e.city, e.state].filter(Boolean).join("/")}
                    </div>
                  )}
                </div>
                {e.fee && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatMoneyBRL(e.fee)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
