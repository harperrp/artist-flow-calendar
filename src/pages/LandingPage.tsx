import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import previewDashboard from "@/assets/preview-dashboard.jpg";
import previewKanban from "@/assets/preview-kanban.jpg";
import previewCalendar from "@/assets/preview-calendar.jpg";
import {
  CalendarDays,
  Handshake,
  FileText,
  LayoutDashboard,
  Map,
  DollarSign,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  Play,
  ChevronRight,
  MapPin,
  Bell,
  Check,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Inteligente",
    description:
      "Visão 360° dos seus shows, leads e receitas em tempo real com gráficos interativos.",
  },
  {
    icon: CalendarDays,
    title: "Agenda Centralizada",
    description:
      "Calendário visual com prevenção de conflitos e código de cores por status.",
  },
  {
    icon: Handshake,
    title: "Funil de Vendas",
    description:
      "Kanban drag-and-drop para gerenciar leads da prospecção ao fechamento.",
  },
  {
    icon: FileText,
    title: "Gestão de Contratos",
    description:
      "Controle de documentos, status e vínculo automático com leads e eventos.",
  },
  {
    icon: Map,
    title: "Mapa de Oportunidades",
    description:
      "Visualização geográfica com cálculo de distâncias e otimização de rotas.",
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description:
      "Acompanhe receitas confirmadas vs estimadas e performance por período.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Economize Tempo",
    description: "Reduza em até 70% o tempo gasto com planilhas e agendas manuais.",
    stat: "70%",
    statLabel: "menos tempo",
  },
  {
    icon: TrendingUp,
    title: "Aumente Vendas",
    description: "Funil visual que não deixa nenhum lead cair no esquecimento.",
    stat: "3x",
    statLabel: "mais conversões",
  },
  {
    icon: Shield,
    title: "Nunca Perca Datas",
    description: "Prevenção automática de conflitos e alertas inteligentes.",
    stat: "0",
    statLabel: "shows perdidos",
  },
  {
    icon: Zap,
    title: "Decisões Rápidas",
    description: "Dados centralizados para negociar com confiança em segundos.",
    stat: "10s",
    statLabel: "para decidir",
  },
];

const plans = [
  {
    name: "Starter",
    slug: "starter",
    price: "R$ 97",
    period: "/mês",
    description: "Para artistas que estão começando a profissionalizar sua gestão.",
    features: [
      "Até 2 usuários",
      "Agenda e calendário",
      "Funil de vendas básico",
      "Até 50 leads/mês",
      "Suporte por email",
    ],
    cta: "Começar Agora",
    popular: false,
  },
  {
    name: "Profissional",
    slug: "professional",
    price: "R$ 197",
    period: "/mês",
    description: "Para artistas e produtores com agenda ativa e equipe.",
    features: [
      "Até 10 usuários",
      "Tudo do Starter",
      "Mapa de oportunidades",
      "Controle financeiro completo",
      "Gestão de contratos",
      "Leads ilimitados",
      "Suporte prioritário",
    ],
    cta: "Assinar Profissional",
    popular: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: "R$ 397",
    period: "/mês",
    description: "Para agências e escritórios com múltiplos artistas.",
    features: [
      "Usuários ilimitados",
      "Tudo do Profissional",
      "Multi-artistas",
      "Relatórios avançados",
      "API de integração",
      "Gerente de conta dedicado",
      "SLA de suporte 24h",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Manager - Banda XYZ",
    content:
      "O CRM transformou nossa gestão de shows. Antes perdíamos oportunidades por falta de organização.",
    rating: 5,
  },
  {
    name: "Ana Costa",
    role: "Produtora Executiva",
    content:
      "O mapa de oportunidades é genial! Consigo planejar turnês otimizando rotas e maximizando cachês.",
    rating: 5,
  },
  {
    name: "Roberto Mendes",
    role: "Artista Solo",
    content:
      "Finalmente tenho controle total da minha carreira. Sei exatamente quanto vou faturar no mês.",
    rating: 5,
  },
];

const previewScreens = [
  { id: "dashboard", label: "Dashboard", image: previewDashboard, description: "Visão completa dos seus KPIs, agenda e receitas em um único painel." },
  { id: "kanban", label: "Funil de Vendas", image: previewKanban, description: "Gerencie seus leads com drag-and-drop, da prospecção ao fechamento." },
  { id: "calendar", label: "Agenda", image: previewCalendar, description: "Calendário visual com código de cores por status e prevenção de conflitos." },
];

function PreviewTabs() {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-2 flex-wrap">
        {previewScreens.map((screen, i) => (
          <Button
            key={screen.id}
            variant={active === i ? "default" : "outline"}
            size="sm"
            onClick={() => setActive(i)}
            className="gap-2"
          >
            {screen.label}
          </Button>
        ))}
      </div>

      <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
        <img
          src={previewScreens[active].image}
          alt={`Preview do ${previewScreens[active].label}`}
          className="w-full h-auto"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-6 md:p-8">
          <h3 className="text-xl font-bold mb-1">{previewScreens[active].label}</h3>
          <p className="text-muted-foreground max-w-lg">{previewScreens[active].description}</p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              RL
            </div>
            <span className="text-xl font-bold tracking-tight">ShowCRM</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Depoimentos
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/login?plan=professional">
              <Button size="sm" className="gap-2">
                Começar Grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="gap-2 px-4 py-2">
                <Zap className="h-3 w-3" />
                CRM especializado para artistas
              </Badge>
              
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Gerencie seus{" "}
                <span className="text-primary">shows</span> como um{" "}
                <span className="text-primary">profissional</span>
              </h1>
              
              <p className="text-lg text-muted-foreground md:text-xl max-w-xl">
                O CRM completo para artistas que querem dominar sua agenda, 
                fechar mais contratos e nunca mais perder uma oportunidade.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login?plan=professional">
                  <Button size="lg" className="gap-2 w-full sm:w-auto text-base px-8">
                    Começar Agora — É Grátis
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href="#pricing">
                  <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto text-base">
                    <Play className="h-5 w-5" />
                    Ver Planos
                  </Button>
                </a>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-xs font-bold text-primary-foreground"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    +500 artistas já usam
                  </p>
                </div>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative">
              <div className="relative rounded-2xl border bg-card p-2 shadow-2xl">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-3 w-24 rounded bg-foreground/20" />
                        <div className="h-2 w-16 rounded bg-foreground/10" />
                      </div>
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Shows", value: "12", color: "bg-primary" },
                        { label: "Leads", value: "28", color: "bg-accent" },
                        { label: "Receita", value: "R$45k", color: "bg-primary" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-background/80 p-3">
                          <div className={`h-1.5 w-8 rounded ${stat.color} mb-2`} />
                          <div className="text-lg font-bold">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="rounded-lg bg-background/80 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        <span className="font-medium">Próximos Shows</span>
                      </div>
                      {["São Paulo - 15/03", "Rio de Janeiro - 22/03", "Curitiba - 01/04"].map((show) => (
                        <div key={show} className="flex items-center gap-2 py-2 border-b last:border-0">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm">{show}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -left-8 top-1/4 rounded-xl border bg-card p-4 shadow-lg animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Show Confirmado!</div>
                    <div className="text-xs text-muted-foreground">R$ 15.000</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-4 bottom-1/4 rounded-xl border bg-card p-4 shadow-lg animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">3 cidades próximas</div>
                    <div className="text-xs text-muted-foreground">Otimize sua rota</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Preview Section */}
      <section className="border-t py-20 md:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Veja na Prática</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              Conheça o sistema por dentro
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Interface moderna e intuitiva, feita para você focar no que importa: fechar mais shows.
            </p>
          </div>

          <PreviewTabs />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desenvolvido especialmente para a realidade de artistas e produtores brasileiros.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Benefícios</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              Resultados reais para sua carreira
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Artistas que usam o ShowCRM relatam melhorias significativas em sua gestão.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <div className="text-4xl font-bold text-primary mb-1">{benefit.stat}</div>
                <div className="text-sm text-muted-foreground mb-3">{benefit.statLabel}</div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Planos</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e escale conforme sua carreira cresce. Cancele quando quiser.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.slug}
                className={`relative flex flex-col p-8 transition-all hover:shadow-lg ${
                  plan.popular
                    ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                    : "border"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                    Mais Popular
                  </Badge>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to={`/login?plan=${plan.slug}&mode=signup`}>
                  <Button
                    className="w-full gap-2"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Depoimentos</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              O que dizem nossos usuários
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 md:px-6 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 md:p-16 text-primary-foreground">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              Pronto para transformar sua carreira?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Comece agora e veja como o ShowCRM pode revolucionar 
              a gestão dos seus shows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?plan=professional&mode=signup">
                <Button size="lg" variant="secondary" className="gap-2 text-base px-8 w-full sm:w-auto">
                  Criar Conta Grátis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="gap-2 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto">
                  Ver Planos
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                RL
              </div>
              <span className="text-xl font-bold tracking-tight">ShowCRM</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 ShowCRM. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
