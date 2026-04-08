import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Activity, Cookie, Zap, BarChart3, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-mono text-lg font-bold text-gradient-primary">SecureScan</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Painel <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/auth">Entrar</Link></Button>
                <Button asChild><Link to="/auth">Comece Grátis</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 grid-cyber opacity-40" />
        <div className="container relative mx-auto px-4 py-24 text-center lg:py-32">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              <Zap className="mr-1 h-3 w-3" /> Varredura de segurança em 1 clique
            </Badge>
          </motion.div>
          <motion.h1 {...fadeUp} transition={{ delay: 0.1 }} className="mx-auto max-w-4xl text-4xl font-bold leading-tight lg:text-6xl">
            Encontre vulnerabilidades{" "}
            <span className="text-gradient-primary">antes dos atacantes</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Varredura de segurança automatizada para suas aplicações web. Detecte API keys expostas, headers inseguros, problemas de CORS e mais — incluindo páginas autenticadas via injeção de cookies.
          </motion.p>
          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="animate-pulse-glow">
              <Link to="/auth">Comece a Escanear Grátis <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Veja Como Funciona</a>
            </Button>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="mx-auto mt-12 max-w-2xl rounded-lg border border-border/50 bg-card/50 p-4 font-mono text-sm text-muted-foreground backdrop-blur-sm">
            <div className="flex items-center gap-2 text-primary">
              <span className="text-muted-foreground">$</span> securescan --url https://meuapp.com --authenticated
            </div>
            <div className="mt-2 text-left">
              <div>✓ Verificando headers... <span className="text-primary">aprovado</span></div>
              <div>✗ Chave AWS encontrada em /static/js/main.js — <span className="text-destructive">CRÍTICO</span></div>
              <div>✗ CORS permite origem wildcard — <span className="text-warning">ALTO</span></div>
              <div className="mt-1">Pontuação: <span className="text-warning">65/100</span> — 2 problemas críticos encontrados</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Tudo que você precisa para <span className="text-gradient-primary">ficar seguro</span></h2>
          <p className="mt-3 text-muted-foreground">Varredura de segurança completa do lado do cliente, sem configuração</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Lock, title: "Detecção de Segredos Expostos", desc: "Encontra chaves AWS, tokens de API, credenciais Firebase, JWTs e chaves privadas vazadas no código frontend." },
            { icon: Shield, title: "Auditoria de Headers de Segurança", desc: "Verifica HSTS, CSP, X-Frame-Options e outros headers HTTP de segurança essenciais." },
            { icon: Cookie, title: "Varredura Autenticada", desc: "Escaneie páginas protegidas via injeção de cookies — sem credenciais necessárias. Funciona com qualquer sistema de autenticação." },
            { icon: Activity, title: "Configuração CORS", desc: "Detecta origens wildcard, vazamento de credenciais e vulnerabilidades de reflexão de origem." },
            { icon: BarChart3, title: "Acompanhamento de Pontuação", desc: "Monitore sua postura de segurança ao longo do tempo com tendências de pontuação e comparações históricas." },
            { icon: Zap, title: "Vitórias Rápidas", desc: "Passos de remediação acionáveis classificados por impacto. Corrija os problemas mais críticos em minutos." },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full border-border/50 bg-card/50 transition-colors hover:border-primary/30">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{f.desc}</p></CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-mono">SecureScan</span>
          </div>
          <p>© {new Date().getFullYear()} SecureScan. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
