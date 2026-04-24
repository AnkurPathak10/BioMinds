import Link from "next/link";
import {
  NotebookPen,
  BookOpen,
  Bug,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to <span className="gradient-text">LabFlow AI</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your AI-powered lab operating system. Pick a module to get started.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Notebook Entries", value: "0", icon: NotebookPen, trend: "Start recording" },
          { label: "Papers Uploaded", value: "0", icon: FileText, trend: "Upload PDFs" },
          { label: "Debug Sessions", value: "0", icon: Bug, trend: "Diagnose an issue" },
          { label: "Time Saved", value: "0h", icon: Clock, trend: "This week" },
        ].map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: NotebookPen,
            title: "AI Lab Notebook",
            desc: "Record experiments with voice or text. AI structures your notes into hypothesis, materials, procedure, and results.",
            href: "/dashboard/notebook",
            badge: "AI-Powered",
            gradient: "from-emerald-500/5 to-teal-500/5",
            iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            primary: true,
          },
          {
            icon: BookOpen,
            title: "Literature Brain",
            desc: "Upload your research papers and ask questions across your entire library. Get cited answers in seconds.",
            href: "/dashboard/library",
            badge: "RAG-Powered",
            gradient: "from-blue-500/5 to-indigo-500/5",
            iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            primary: false,
          },
          {
            icon: Bug,
            title: "Experiment Debugger",
            desc: "Upload failed results and get AI-powered diagnoses. Ranked probable causes with confidence scores.",
            href: "/dashboard/debug",
            badge: "Vision AI",
            gradient: "from-orange-500/5 to-red-500/5",
            iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
            primary: false,
          },
        ].map((mod) => (
          <Card key={mod.title} className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mod.iconBg}`}>
                  <mod.icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {mod.badge}
                </Badge>
              </div>
              <CardTitle className="mt-4 text-lg">{mod.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
              <Link href={mod.href}>
                <Button variant={mod.primary ? "default" : "outline"} className="w-full group/btn">
                  Open {mod.title.split(" ").pop()}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting started */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Getting Started</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Create your first notebook, upload some papers to your library, or
            try debugging an experiment. LabFlow AI learns from your data to
            provide better insights over time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
