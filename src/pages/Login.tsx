import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { CalendarDays, Users, FileText, Map, TrendingUp, CheckCircle } from "lucide-react";

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

export default function Login() {
  const { user, loading } = useAuth();
  const location = useLocation() as any;
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<"login" | "signup">("login");

  const currentSchema = mode === "signup" ? signupSchema : loginSchema;
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(currentSchema as any),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  // Reset form when mode changes
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
        data: { display_name: values.displayName },
      },
    });
    if (error) {
      toast("Não foi possível cadastrar", { description: error.message });
      return;
    }
    toast("Conta criada", {
      description: "Verifique seu email para confirmar o cadastro.",
    });
    setMode("login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center px-4 py-10 lg:grid-cols-2 lg:gap-12 lg:px-8">
        {/* Left side - Branding */}
        <div className="fade-up hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              RL
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CRM Rodrigo Lopes</h1>
              <p className="text-sm text-muted-foreground">Gestão de Shows e Artistas</p>
            </div>
          </div>

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

          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-status-confirmed" />
            <span>Dados seguros e criptografados</span>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="fade-up lg:pl-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              RL
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CRM Rodrigo Lopes</h1>
            </div>
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
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Seu nome completo"
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
                  {mode === "login" ? "Entrar" : "Criar conta"}
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