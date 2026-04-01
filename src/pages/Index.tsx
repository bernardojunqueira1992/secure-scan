import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Activity, Cookie, Zap, BarChart3, Check, ArrowRight } from "lucide-react";
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
                <Link to="/dashboard">Dashboard <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/auth">Sign In</Link></Button>
                <Button asChild><Link to="/auth">Get Started Free</Link></Button>
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
              <Zap className="mr-1 h-3 w-3" /> Security scanning in 1 click
            </Badge>
          </motion.div>
          <motion.h1 {...fadeUp} transition={{ delay: 0.1 }} className="mx-auto max-w-4xl text-4xl font-bold leading-tight lg:text-6xl">
            Find vulnerabilities{" "}
            <span className="text-gradient-primary">before attackers do</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Automated security scanning for your web apps. Detect exposed API keys, insecure headers, CORS issues, and more — including authenticated pages via cookie injection.
          </motion.p>
          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="animate-pulse-glow">
              <Link to="/auth">Start Scanning Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">See How It Works</a>
            </Button>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="mx-auto mt-12 max-w-2xl rounded-lg border border-border/50 bg-card/50 p-4 font-mono text-sm text-muted-foreground backdrop-blur-sm">
            <div className="flex items-center gap-2 text-primary">
              <span className="text-muted-foreground">$</span> securescan --url https://myapp.com --authenticated
            </div>
            <div className="mt-2 text-left">
              <div>✓ Scanning headers... <span className="text-primary">passed</span></div>
              <div>✗ AWS key found in /static/js/main.js — <span className="text-destructive">CRITICAL</span></div>
              <div>✗ CORS allows wildcard origin — <span className="text-warning">HIGH</span></div>
              <div className="mt-1">Score: <span className="text-warning">65/100</span> — 2 critical issues found</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Everything you need to <span className="text-gradient-primary">stay secure</span></h2>
          <p className="mt-3 text-muted-foreground">Comprehensive client-side security scanning with zero setup</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Lock, title: "Exposed Secrets Detection", desc: "Finds AWS keys, API tokens, Firebase credentials, JWTs, and private keys leaked in your frontend code." },
            { icon: Shield, title: "Security Headers Audit", desc: "Checks HSTS, CSP, X-Frame-Options, and other critical HTTP security headers." },
            { icon: Cookie, title: "Authenticated Scanning", desc: "Scan protected pages via cookie injection — no credentials needed. Works with any auth system." },
            { icon: Activity, title: "CORS Configuration", desc: "Detects wildcard origins, credential leaks, and origin reflection vulnerabilities." },
            { icon: BarChart3, title: "Score Tracking", desc: "Monitor your security posture over time with score trends and historical comparisons." },
            { icon: Zap, title: "Quick Wins", desc: "Actionable remediation steps ranked by impact. Fix the most critical issues in minutes." },
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

      {/* Pricing */}
      <section className="border-t border-border/30 bg-card/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Simple, transparent <span className="text-gradient-primary">pricing</span></h2>
            <p className="mt-3 text-muted-foreground">Start free. Scale when you're ready.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3 mx-auto max-w-4xl">
            {[
              { name: "Free", price: "$0", scans: "50 scans/mo", urls: "3 URLs", sessions: "2 sessions", api: false, cta: "Get Started" },
              { name: "Pro", price: "$19", scans: "500 scans/mo", urls: "10 URLs", sessions: "10 sessions", api: true, cta: "Upgrade to Pro", featured: true },
              { name: "Team", price: "$49", scans: "2,000 scans/mo", urls: "Unlimited URLs", sessions: "Unlimited sessions", api: true, cta: "Go Team" },
            ].map((plan, i) => (
              <Card key={i} className={`relative ${plan.featured ? "border-primary/50 glow-primary" : "border-border/50"}`}>
                {plan.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "$0" && <span className="text-muted-foreground">/mo</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[plan.scans, plan.urls, plan.sessions, plan.api ? "API access" : null, plan.api ? "Priority support" : "Community support"].filter(Boolean).map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </div>
                  ))}
                  <Button className="mt-4 w-full" variant={plan.featured ? "default" : "outline"} asChild>
                    <Link to="/auth">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-mono">SecureScan</span>
          </div>
          <p>© {new Date().getFullYear()} SecureScan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
