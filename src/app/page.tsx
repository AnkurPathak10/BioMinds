import Link from "next/link";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  FlaskConical,
  BookOpen,
  Bug,
  Mic,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      {/* ── Animated background ── */}
      <div className="fixed inset-0 -z-10 gradient-bg" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.17_162_/_15%),transparent)]" />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FlaskConical className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Lab<span className="gradient-text">Flow</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Show when="signed-out">
              <SignInButton>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm" className="glow">
                  Get Started Free
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="sm">
                  Dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </Show>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Lab OS for Modern Science
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Your Lab,{" "}
            <span className="gradient-text">Supercharged</span>{" "}
            with AI
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Voice-powered lab notebooks, an AI that reads your papers, and an
            experiment debugger that diagnoses failures like a senior scientist.
            Built for researchers, by researchers.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Show when="signed-out">
              <SignUpButton>
                <Button size="lg" className="glow h-12 px-8 text-base">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="lg" className="glow h-12 px-8 text-base">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Show>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              <Star className="mr-2 h-4 w-4" />
              Star on GitHub
            </Button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="mx-auto mt-20 grid max-w-2xl grid-cols-3 gap-8 text-center">
          {[
            { value: "10K+", label: "Researchers" },
            { value: "500K+", label: "Experiments Logged" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three Modules. One{" "}
              <span className="gradient-text">Powerful</span> Platform.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to run a modern lab — from recording experiments
              to debugging failures.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Mic,
                title: "AI Lab Notebook",
                description:
                  "Speak your experiment notes at the bench. AI transcribes and structures them into hypothesis, materials, procedure, and results — instantly.",
                features: [
                  "Voice-to-structured entries",
                  "Smart templates for PCR, Western Blot, etc.",
                  "Semantic search across all experiments",
                ],
              },
              {
                icon: BookOpen,
                title: "Literature Brain",
                description:
                  "Upload your PDF library and ask questions across all your papers. Get cited answers in seconds, not hours.",
                features: [
                  "Ask questions across 100s of papers",
                  "Auto-cited answers with source links",
                  "AI-generated literature review drafts",
                ],
              },
              {
                icon: Bug,
                title: "Experiment Debugger",
                description:
                  "Upload your failed gel, blot, or growth curve. AI analyzes like a senior scientist and gives ranked probable causes.",
                features: [
                  "Multi-modal image analysis (DeepMinds AI)",
                  "Cross-references your past experiments",
                  "Ranked diagnoses with confidence scores",
                ],
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {feature.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              From bench to insight in three simple steps.
            </p>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Record & Upload",
                description:
                  "Speak your lab notes, upload PDFs, or drag in your failed experiment images.",
              },
              {
                step: "02",
                title: "AI Processes",
                description:
                  "Our AI structures your notes, embeds your papers, and analyzes your images using DeepMinds AI.",
              },
              {
                step: "03",
                title: "Get Insights",
                description:
                  "Structured notebook entries, cited literature answers, and ranked failure diagnoses — in seconds.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold gradient-text">
                  {item.step}
                </div>
                <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to{" "}
            <span className="gradient-text">Transform</span>{" "}
            Your Lab?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of researchers who are already saving hours every
            week. Free for students — forever.
          </p>
          <div className="mt-8">
            <Show when="signed-out">
              <SignUpButton>
                <Button size="lg" className="glow h-12 px-8 text-base">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="lg" className="glow h-12 px-8 text-base">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Show>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <span className="font-semibold">LabFlow AI</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            SOC2 Compliant · HIPAA Ready · Your data stays yours
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LabFlow AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
