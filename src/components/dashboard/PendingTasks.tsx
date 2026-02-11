import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrg } from "@/providers/OrgProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Calendar, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityConfig: Record<string, { label: string; class: string }> = {
  high: { label: "Alta", class: "bg-destructive/10 text-destructive border-destructive/30" },
  medium: { label: "Média", class: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  low: { label: "Baixa", class: "bg-blue-100 text-blue-800 border-blue-300" },
};

export function PendingTasks() {
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("tasks")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .eq("is_completed", false)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
  });

  async function addTask() {
    if (!newTitle.trim() || !activeOrgId) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await db.from("tasks").insert({
      organization_id: activeOrgId,
      title: newTitle.trim(),
      created_by: user.id,
    });
    if (error) {
      toast.error("Erro ao criar tarefa");
      return;
    }
    setNewTitle("");
    qc.invalidateQueries({ queryKey: ["tasks", activeOrgId] });
  }

  async function toggleTask(id: string) {
    await db.from("tasks").update({ is_completed: true, completed_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["tasks", activeOrgId] });
    toast.success("Tarefa concluída!");
  }

  return (
    <Card className="border bg-card/70 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          Tarefas Pendentes
        </h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length} pendentes
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma tarefa pendente 🎉
          </p>
        ) : (
          tasks.map((task: any) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <Checkbox
                className="mt-0.5"
                onCheckedChange={() => toggleTask(task.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{task.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                    </span>
                  )}
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityConfig[task.priority]?.class || ""}`}>
                    {priorityConfig[task.priority]?.label || task.priority}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Nova tarefa..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="text-sm"
        />
        <Button size="sm" onClick={addTask} disabled={!newTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
