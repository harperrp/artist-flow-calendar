import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrg } from "@/providers/OrgProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrgMembers } from "@/hooks/useUserRole";
import { useSendNotification } from "@/hooks/useNotifications";
import {
  Plus, Calendar, CheckSquare, ListChecks, Clock,
  AlertTriangle, Search, Trash2, Edit, RotateCcw, Send, User,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityConfig: Record<string, { label: string; class: string; sort: number }> = {
  high: { label: "Alta", class: "bg-destructive/10 text-destructive border-destructive/30", sort: 0 },
  medium: { label: "Média", class: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30", sort: 1 },
  low: { label: "Baixa", class: "bg-primary/10 text-primary border-primary/30", sort: 2 },
};

export function TasksPage() {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: members = [] } = useOrgMembers();
  const sendNotification = useSendNotification();
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const isCompleted = tab === "completed";

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks-full", activeOrgId, isCompleted],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("tasks")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .eq("is_completed", isCompleted)
        .order(isCompleted ? "completed_at" : "due_date", {
          ascending: isCompleted ? false : true,
          nullsFirst: false,
        });
      if (error) throw error;
      return data as any[];
    },
  });

  // Build member lookup
  const memberMap = new Map(members.map((m: any) => [m.userId, m]));

  const filtered = tasks
    .filter((t: any) => {
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (!isCompleted) {
        return (priorityConfig[a.priority]?.sort ?? 9) - (priorityConfig[b.priority]?.sort ?? 9);
      }
      return 0;
    });

  const stats = {
    total: tasks.length,
    high: tasks.filter((t: any) => t.priority === "high").length,
    overdue: tasks.filter(
      (t: any) => !t.is_completed && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
    ).length,
  };

  function openNew() {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setAssignedTo("");
    setDialogOpen(true);
  }

  function openEdit(task: any) {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "medium");
    setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    setAssignedTo(task.assigned_to || "__none__");
    setDialogOpen(true);
  }

  async function saveTask() {
    if (!title.trim() || !activeOrgId) return;
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;

    const payload: any = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || null,
      assigned_to: assignedTo && assignedTo !== "__none__" ? assignedTo : null,
    };

    let taskId: string | null = null;

    if (editingTask) {
      const { error } = await db.from("tasks").update(payload).eq("id", editingTask.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      taskId = editingTask.id;
      toast.success("Tarefa atualizada");
    } else {
      const { data: created, error } = await db.from("tasks").insert({
        ...payload,
        organization_id: activeOrgId,
        created_by: currentUser.id,
      }).select("id").single();
      if (error) { toast.error("Erro ao criar tarefa"); return; }
      taskId = created?.id;
      toast.success("Tarefa criada");
    }

    // Send notification if assigned to someone else
    if (assignedTo && assignedTo !== "__none__" && assignedTo !== currentUser.id && taskId) {
      const assignee = memberMap.get(assignedTo);
      const senderName = members.find((m: any) => m.userId === currentUser.id)?.displayName || "Alguém";
      sendNotification.mutate({
        userId: assignedTo,
        type: "task_assigned",
        title: "Nova tarefa atribuída",
        message: `${senderName} atribuiu a tarefa "${title.trim()}" para você`,
        entityType: "task",
        entityId: taskId,
      });
    }

    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["tasks-full", activeOrgId] });
    qc.invalidateQueries({ queryKey: ["tasks", activeOrgId] });
  }

  async function toggleComplete(id: string, complete: boolean) {
    await db.from("tasks").update({
      is_completed: complete,
      completed_at: complete ? new Date().toISOString() : null,
    }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["tasks-full", activeOrgId] });
    qc.invalidateQueries({ queryKey: ["tasks", activeOrgId] });
    toast.success(complete ? "Tarefa concluída!" : "Tarefa reaberta");
  }

  async function deleteTask(id: string) {
    await db.from("tasks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["tasks-full", activeOrgId] });
    qc.invalidateQueries({ queryKey: ["tasks", activeOrgId] });
    toast.success("Tarefa removida");
  }

  function getAssigneeName(userId: string | null) {
    if (!userId) return null;
    const m = memberMap.get(userId);
    return m?.displayName || m?.email || null;
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            Tarefas
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie e atribua tarefas para a equipe
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{isCompleted ? "Concluídas" : "Pendentes"}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.high}</p>
            <p className="text-xs text-muted-foreground">Prioridade Alta</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-yellow-500/10 p-2">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.overdue}</p>
            <p className="text-xs text-muted-foreground">Atrasadas</p>
          </div>
        </Card>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <Card className="border bg-card/70 divide-y divide-border">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {isCompleted ? "Nenhuma tarefa concluída ainda" : "Nenhuma tarefa pendente 🎉"}
            </p>
            {!isCompleted && (
              <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={openNew}>
                <Plus className="h-4 w-4" /> Criar primeira tarefa
              </Button>
            )}
          </div>
        ) : (
          filtered.map((task: any) => {
            const overdue =
              !task.is_completed &&
              task.due_date &&
              isPast(new Date(task.due_date)) &&
              !isToday(new Date(task.due_date));
            const assigneeName = getAssigneeName(task.assigned_to);

            return (
              <div
                key={task.id}
                className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors group"
              >
                <Checkbox
                  checked={task.is_completed}
                  className="mt-1"
                  onCheckedChange={(v) => toggleComplete(task.id, !!v)}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${task.is_completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {task.due_date && (
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          overdue ? "text-destructive font-medium" : "text-muted-foreground"
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.due_date), "dd MMM yyyy", { locale: ptBR })}
                        {overdue && " (atrasada)"}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${priorityConfig[task.priority]?.class || ""}`}
                    >
                      {priorityConfig[task.priority]?.label || task.priority}
                    </Badge>
                    {assigneeName && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                        <User className="h-2.5 w-2.5" />
                        {assigneeName}
                      </Badge>
                    )}
                    {task.is_completed && task.completed_at && (
                      <span className="text-xs text-muted-foreground">
                        Concluída em {format(new Date(task.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {task.is_completed && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleComplete(task.id, false)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask(task.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O que precisa ser feito?" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes opcionais..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                    <SelectItem value="medium">🟡 Média</SelectItem>
                    <SelectItem value="low">🔵 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Atribuir para
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguém</SelectItem>
                  {members.map((m: any) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      <span className="flex items-center gap-2">
                        {m.displayName || m.email}
                        <span className="text-xs text-muted-foreground">({m.roleLabel})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveTask} disabled={!title.trim()}>
              {editingTask ? "Salvar" : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
