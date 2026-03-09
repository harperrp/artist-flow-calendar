import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pause, XCircle, ArrowUpCircle, Ban } from "lucide-react";

type OrgRow = {
  id: string;
  name: string;
  plan: string;
  status: string;
};

const plans = [
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Profissional" },
  { value: "enterprise", label: "Enterprise" },
];

export function OrgActionsMenu({ org }: { org: OrgRow }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = React.useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const updateSub = useMutation({
    mutationFn: async (patch: Record<string, string>) => {
      const { error } = await db
        .from("subscriptions")
        .update(patch)
        .eq("organization_id", org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-orgs"] });
      toast.success("Atualizado com sucesso");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleStatus = (status: string, label: string) => {
    setConfirm({
      title: `${label} assinatura`,
      description: `Tem certeza que deseja ${label.toLowerCase()} a assinatura de "${org.name}"?`,
      action: () => updateSub.mutate({ status }),
    });
  };

  const handlePlan = (plan: string, label: string) => {
    setConfirm({
      title: "Alterar plano",
      description: `Alterar o plano de "${org.name}" para ${label}?`,
      action: () => updateSub.mutate({ plan }),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Change plan */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Alterar plano
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {plans
                .filter((p) => p.value !== org.plan)
                .map((p) => (
                  <DropdownMenuItem key={p.value} onClick={() => handlePlan(p.value, p.label)}>
                    {p.label}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Pause */}
          {org.status === "active" && (
            <DropdownMenuItem className="gap-2" onClick={() => handleStatus("paused", "Pausar")}>
              <Pause className="h-4 w-4" />
              Pausar assinatura
            </DropdownMenuItem>
          )}

          {/* Reactivate */}
          {(org.status === "paused" || org.status === "inactive") && (
            <DropdownMenuItem className="gap-2" onClick={() => handleStatus("active", "Reativar")}>
              <ArrowUpCircle className="h-4 w-4" />
              Reativar assinatura
            </DropdownMenuItem>
          )}

          {/* Cancel */}
          {org.status !== "canceled" && (
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => handleStatus("canceled", "Cancelar")}
            >
              <XCircle className="h-4 w-4" />
              Cancelar assinatura
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Deactivate org */}
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onClick={() =>
              setConfirm({
                title: "Desativar organização",
                description: `Isso cancelará a assinatura e desativará "${org.name}". Os dados serão mantidos mas o acesso será bloqueado. Continuar?`,
                action: () => updateSub.mutate({ status: "canceled" }),
              })
            }
          >
            <Ban className="h-4 w-4" />
            Desativar organização
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirm?.action();
                setConfirm(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
