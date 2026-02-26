import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  MessageSquare,
  MessageCircle,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  FileText,
  Activity,
  ListTodo,
  Receipt,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { LeadMessagesThread } from "./LeadMessagesThread";
import { LeadFinancialSummary } from "@/components/finance/LeadFinancialSummary";
import { useOrg } from "@/providers/OrgProvider";

interface Activity {
  id: string;
  type: "note" | "stage_change" | "contact" | "meeting" | "email";
  content: string;
  createdAt: Date;
  user?: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  priority: "low" | "medium" | "high";
}

interface LeadDetailPanelProps {
  lead: any;
  onClose?: () => void;
  onUpdate?: (data: any) => void;
}

// Mock data for demo
const mockActivities: Activity[] = [
  {
    id: "1",
    type: "note",
    content: "Cliente demonstrou interesse em show para evento de aniversário da cidade",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    user: "João Silva",
  },
  {
    id: "2",
    type: "stage_change",
    content: "Lead movido de Prospecção para Contato",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    user: "Sistema",
  },
  {
    id: "3",
    type: "contact",
    content: "Ligação realizada para discutir valores e disponibilidade",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    user: "Maria Santos",
  },
  {
    id: "4",
    type: "email",
    content: "Proposta comercial enviada por email",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    user: "João Silva",
  },
];

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Enviar proposta atualizada",
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    priority: "high",
  },
  {
    id: "2",
    title: "Ligar para confirmar data",
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48),
    priority: "medium",
  },
  {
    id: "3",
    title: "Verificar disponibilidade do artista",
    completed: true,
    priority: "low",
  },
];

const activityIcons = {
  note: MessageSquare,
  stage_change: Activity,
  contact: Phone,
  meeting: Calendar,
  email: Mail,
};

const activityColors = {
  note: "bg-blue-100 text-blue-600",
  stage_change: "bg-purple-100 text-purple-600",
  contact: "bg-green-100 text-green-600",
  meeting: "bg-yellow-100 text-yellow-600",
  email: "bg-red-100 text-red-600",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-yellow-100 text-yellow-600",
  high: "bg-red-100 text-red-600",
};

export function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
  const { activeOrgId } = useOrg();
  const [activities] = useState(mockActivities);
  const [tasks, setTasks] = useState(mockTasks);
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

  function toggleTask(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  }

  function addNote() {
    if (!newNote.trim()) return;
    // In real app, save to database
    setNewNote("");
  }

  function addTask() {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      priority: newTaskPriority,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
    };
    setTasks((prev) => [task, ...prev]);
    setNewTask("");
  }

  if (!lead) return null;

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{lead.contractor_name}</h2>
            {lead.contractor_type && (
              <Badge variant="outline" className="mt-1">
                <Building2 className="h-3 w-3 mr-1" />
                {lead.contractor_type}
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {lead.stage}
          </Badge>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {(lead.city || lead.state || lead.street) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {[
                  lead.street && lead.street_number ? `${lead.street}, ${lead.street_number}` : lead.street,
                  lead.neighborhood,
                  lead.city,
                  lead.state,
                ].filter(Boolean).join(" - ")}
              </span>
            </div>
          )}
          {lead.event_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {format(new Date(lead.event_date), "dd/MM/yyyy")}
            </div>
          )}
          {lead.fee && (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <DollarSign className="h-4 w-4" />
              {formatMoneyBRL(lead.fee)}
            </div>
          )}
          {lead.contact_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {lead.contact_phone}
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      {activeOrgId && lead && (
        <div className="p-4">
          <LeadFinancialSummary lead={lead} orgId={activeOrgId} />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="timeline" className="gap-2">
            <Activity className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Notas
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="flex-1 m-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-4">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.type];
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activityColors[activity.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.content}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{activity.user}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(activity.createdAt, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="flex-1 m-0">
          <LeadMessagesThread leadId={lead.id} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="flex-1 m-0">
          <div className="p-4 border-b">
            <div className="flex gap-2">
              <Input
                placeholder="Nova tarefa..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as any)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" onClick={addTask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[350px]">
            <div className="p-4 space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    task.completed ? "bg-muted/50 opacity-60" : "hover:bg-muted/30"
                  }`}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${task.completed ? "line-through" : ""}`}>
                      {task.title}
                    </div>
                    {task.dueDate && !task.completed && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(task.dueDate, "dd/MM")}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                    {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="flex-1 m-0 flex flex-col">
          <ScrollArea className="flex-1 h-[300px]">
            <div className="p-4 space-y-3">
              {activities
                .filter((a) => a.type === "note")
                .map((note) => (
                  <div key={note.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{note.user}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(note.createdAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t mt-auto">
            <div className="flex gap-2">
              <Textarea
                placeholder="Adicionar nota..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <Button size="icon" className="shrink-0" onClick={addNote}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
