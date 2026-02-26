import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { CalendarDays, Users, FileText, Map, TrendingUp, CheckCircle, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
  displayName: z.string().optional(),
});

const signupSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
  displayName: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
});

const features = [
  { icon: CalendarDays, text: "Agenda inteligente com visão mensal/semanal" },
  { icon: Users, text: "Funil de vendas visual estilo Kanban" },
  { icon: Map, text: "Mapa interativo de shows e leads" },
  { icon: FileText, text: "Gestão completa de contratos" },
  { icon: TrendingUp, text: "Dashboard com métricas de performance" },
];

const planInfo: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: "Starter",
    price: "R$ 97/mês",
    features: ["Até 2 usuários", "Agenda e calendário", "Funil de vendas básico"],
  },
  professional: {
    name: "Profissional",
    price: "R$ 197/mês",
    features: ["Até 10 usuários", "Mapa de oportunidades", "Controle financeiro completo"],
  },
  enterprise: {
    name: "Enterprise",
    price: "R$ 397/mês",
    features: ["Usuários ilimitados", "Multi-artistas", "Suporte 24h"],
  },
};

export default function Login() {
  const { user, loading } = useAuth();
  const location = useLocation() as any;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const selectedPlan = searchParams.get("plan") || null;
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = React.useState<"login" | "signup">(initialMode as any);

  const currentSchema = mode === "signup" ? signupSchema : loginSchema;
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(currentSchema as any),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  React.useEffect(() => {
    form.reset({ email: "", password: "", displayName: "" });
  }, [mode]);

  if (!loading && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        toast("Não foi possível entrar", { description: error.message });
        return;
      }
      const to = location?.state?.from ?? "/app/dashboard";
      navigate(to, { replace: true });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: values.displayName,
          plan: selectedPlan || "starter",
        },
      },
    });
    if (error) {
      toast("Não foi possível cadastrar", { description: error.message });
      return;
    }
    toast("Conta criada!", {
      description: "Verifique seu email para confirmar o cadastro.",
    });
    setMode("login");
  }

  const plan = selectedPlan ? planInfo[selectedPlan] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center px-4 py-10 lg:grid-cols-2 lg:gap-12 lg:px-8">
        {/* Left side - Branding */}
        <div className="fade-up hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              RL
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ShowCRM</h1>
              <p className="text-sm text-muted-foreground">Gestão de Shows e Artistas</p>
            </div>
          </div>

          {plan && mode === "signup" ? (
            <div className="space-y-6">
              <div>
                <Badge variant="secondary" className="mb-3">Plano Selecionado</Badge>
                <h2 className="text-3xl font-bold tracking-tight mb-1">{plan.name}</h2>
                <p className="text-2xl font-semibold text-primary">{plan.price}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Incluso no plano:</p>
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>MVP de demonstração:</strong> Ao criar sua conta, você terá acesso imediato a todas as funcionalidades do plano selecionado.
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Sua agenda e negócios
                <br />
                <span className="text-primary">em um só lugar</span>
              </h2>
              
              <p className="text-muted-foreground mb-8">
                CRM completo para gestão de shows, leads, contratos e visualização geográfica 
                de oportunidades. Tome decisões rápidas com dados em tempo real.
              </p>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-status-confirmed" />
            <span>Dados seguros e criptografados</span>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="fade-up lg:pl-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                RL
              </div>
              <h1 className="text-lg font-bold tracking-tight">ShowCRM</h1>
            </Link>
          </div>

          <Card className="border bg-card p-8 shadow-elev">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">
                  {mode === "login" ? "Entrar" : "Criar conta"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === "login" 
                    ? "Acesse seu painel de gestão" 
                    : plan
                      ? `Assinatura ${plan.name} — ${plan.price}`
                      : "Comece a usar o CRM agora"}
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
                {mode === "signup" && (
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Artista / Agência</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Rodrigo Lopes"
                            autoComplete="name"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="voce@empresa.com" 
                          autoComplete="email" 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          autoComplete={mode === "login" ? "current-password" : "new-password"} 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="h-11 text-base font-medium mt-2">
                  {mode === "login" ? "Entrar" : "Criar conta e assinar"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
              >
                {mode === "login" ? (
                  <>Não tem conta? <span className="text-primary font-medium">Criar agora</span></>
                ) : (
                  <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>
                )}
              </button>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
