import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: BarChart3,
    title: 'Ratio Analysis',
    description: 'Automatically calculate debt, equity, and liquidity ratios from balance sheet data.',
  },
  {
    icon: Zap,
    title: 'AI Recommendations',
    description: 'Get AI-powered buy/sell/hold recommendations with confidence scores.',
  },
  {
    icon: Shield,
    title: 'Risk Assessment',
    description: 'Comprehensive risk scoring with strengths and weaknesses breakdown.',
  },
];

const benefits = [
  'Professional-grade financial analysis',
  'Support for manual entry & file upload',
  'Beautiful interactive charts',
  'Downloadable PDF reports',
  'Company comparison tools',
  'Analysis history & watchlist',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">AI Investment Analyzer</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="default" size="sm">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-electric-glow/10 blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="relative container mx-auto px-6 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8">
              <Zap className="h-3.5 w-3.5" /> AI-Powered Investment Analysis
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6" style={{ color: 'hsl(210 40% 98%)' }}>
              Smarter Investment{' '}
              <span className="text-gradient">Decisions</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'hsl(215 20% 65%)' }}>
              Analyze balance sheets, calculate financial ratios, and get AI-powered
              recommendations — all in one beautiful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="gradient-electric shadow-glow text-primary-foreground border-0 px-8">
                  Start Analyzing <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/new-analysis">
                <Button size="lg" variant="outline" className="border-primary/30 px-8" style={{ color: 'hsl(210 40% 98%)' }}>
                  Try Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Analysis Tools</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to evaluate companies and make confident investment decisions.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="rounded-xl border border-border bg-card p-8 shadow-card hover:shadow-glow transition-shadow duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-electric mb-6">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-6">Built for Modern Investors</h2>
              <p className="text-muted-foreground mb-8">
                Whether you're a retail investor, finance student, or small analyst, get the tools you need without the enterprise price tag.
              </p>
              <div className="grid gap-3">
                {benefits.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm text-foreground">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">Apple Inc. (AAPL)</span>
                    <span className="text-xs font-bold gradient-success rounded-full px-3 py-1 text-success-foreground">STRONG BUY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Debt Ratio', value: '32.4%', color: 'text-success' },
                      { label: 'Current Ratio', value: '1.87', color: 'text-success' },
                      { label: 'D/E Ratio', value: '0.68', color: 'text-success' },
                      { label: 'Risk Score', value: '24/100', color: 'text-success' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-muted p-3">
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                        <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Finance Analyser — AI-powered investment analysis for everyone.
            <br />
            <span className="text-xs">For educational purposes only. Consult a financial advisor before making investment decisions.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
