"use client";

import { useState, useRef } from "react";
import {
  BookOpen,
  Upload,
  Search,
  MessageSquare,
  Send,
  FileText,
  Loader2,
  Sparkles,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Demo papers for UI
const demoPapers = [
  {
    id: "1",
    title: "CRISPR-Cas9 Delivery Methods for In Vivo Gene Editing",
    authors: "Zhang, F. et al.",
    journal: "Nature Biotechnology",
    year: 2024,
    status: "ready" as const,
    chunkCount: 47,
  },
  {
    id: "2",
    title: "Advances in Lipid Nanoparticle Design for mRNA Therapeutics",
    authors: "Karikó, K. & Weissman, D.",
    journal: "Science",
    year: 2025,
    status: "ready" as const,
    chunkCount: 38,
  },
  {
    id: "3",
    title: "Single-Cell RNA Sequencing in Cancer Immunology",
    authors: "Satija, R. et al.",
    journal: "Cell",
    year: 2025,
    status: "processing" as const,
    chunkCount: 0,
  },
];

// Demo chat for UI
const demoMessages = [
  {
    role: "user" as const,
    content:
      "What delivery methods work best for in vivo CRISPR-Cas9 editing?",
  },
  {
    role: "assistant" as const,
    content: `Based on your uploaded papers, the most effective delivery methods for in vivo CRISPR-Cas9 editing include:

**1. Lipid Nanoparticles (LNPs)** — The most clinically advanced method. Zhang et al. (2024) report >80% hepatocyte editing efficiency in mouse models using ionizable LNPs with optimized lipid formulations. Key advantage: transient expression reduces off-target risk.

**2. Adeno-Associated Viruses (AAVs)** — Preferred for tissue-specific targeting. AAV9 shows strong tropism for cardiac and CNS tissues, achieving 40-60% editing in target cells [Zhang et al., 2024].

**3. Engineered Exosomes** — An emerging approach. Karikó & Weissman (2025) describe exosome-mediated delivery that crosses the blood-brain barrier, though efficiency remains lower (15-25%) compared to LNPs.

**Key consideration:** LNPs are recommended for liver-targeted applications, while AAVs remain the gold standard for CNS and muscle tissue editing.

📚 *Sources: Zhang et al. (2024), Karikó & Weissman (2025)*`,
  },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [chatInput, setChatInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Literature Brain
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upload papers and ask questions across your entire library. AI-powered
          RAG with cited answers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library" className="gap-2">
            <FileText className="h-4 w-4" />
            Paper Library
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Ask Questions
          </TabsTrigger>
        </TabsList>

        {/* ── Library Tab ── */}
        <TabsContent value="library" className="mt-6 space-y-6">
          {/* Upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold">Drop PDF papers here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or{" "}
                  <button
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse files
                  </button>{" "}
                  · PDF up to 50MB
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search papers by title, author, or keyword..." className="pl-10" />
          </div>

          {/* Paper list */}
          <div className="space-y-3">
            {demoPapers.map((paper) => (
              <Card key={paper.id} className="group transition-all hover:shadow-sm">
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium leading-snug truncate">
                          {paper.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {paper.authors} · {paper.journal} · {paper.year}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {statusIcon(paper.status)}
                        <Badge
                          variant={
                            paper.status === "ready" ? "secondary" : "outline"
                          }
                          className="text-xs"
                        >
                          {paper.status === "ready"
                            ? `${paper.chunkCount} chunks`
                            : paper.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Chat Tab ── */}
        <TabsContent value="chat" className="mt-6">
          <Card className="flex h-[calc(100vh-16rem)] flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Ask Your Literature
                <Badge variant="secondary" className="ml-2 text-xs">
                  {demoPapers.filter((p) => p.status === "ready").length} papers
                  indexed
                </Badge>
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {demoMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question across your papers..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                    }
                  }}
                />
                <Button size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                AI will search across your indexed papers and provide cited
                answers.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
