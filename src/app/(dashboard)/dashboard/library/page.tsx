"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
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
  AlertCircle,
  Bot,
  User,
  Trash2,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Paper = {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  numPages: number;
  wordCount: number;
  chunkCount: number;
  chunks: string[];
  preview: string;
  status: "uploading" | "ready" | "failed";
  uploadedAt: string;
  error?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Upload PDF handler ──
  const uploadPDF = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum file size is 50MB.",
      });
      return;
    }

    // Add paper with uploading status
    const tempId = `upload-${Date.now()}-${Math.random()}`;
    const newPaper: Paper = {
      id: tempId,
      title: file.name.replace(/\.pdf$/i, ""),
      fileName: file.name,
      fileSize: file.size,
      numPages: 0,
      wordCount: 0,
      chunkCount: 0,
      chunks: [],
      preview: "",
      status: "uploading",
      uploadedAt: new Date().toLocaleString(),
    };

    setPapers((prev) => [newPaper, ...prev]);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("/api/papers/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();

      // Update paper with parsed data
      setPapers((prev) =>
        prev.map((p) =>
          p.id === tempId
            ? {
                ...p,
                id: `paper-${Date.now()}`,
                title: data.title || p.title,
                numPages: data.numPages,
                wordCount: data.wordCount,
                chunkCount: data.chunkCount,
                chunks: data.chunks || [],
                preview: data.preview || "",
                status: "ready" as const,
              }
            : p
        )
      );

      toast.success("Paper uploaded!", {
        description: `"${data.title}" — ${data.numPages} pages, ${data.chunkCount} chunks indexed.`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";

      setPapers((prev) =>
        prev.map((p) =>
          p.id === tempId
            ? { ...p, status: "failed" as const, error: msg }
            : p
        )
      );

      toast.error("Upload failed", { description: msg });
    }
  }, []);

  // ── File input handler ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(uploadPDF);
    }
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Drag & drop handlers ──
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(uploadPDF);
    }
  };

  // ── Delete paper ──
  const deletePaper = (paperId: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== paperId));
    toast.success("Paper removed");
  };

  // ── Chat with papers ──
  const sendChatMessage = async () => {
    const question = chatInput.trim();
    if (!question) return;

    const readyPapers = papers.filter((p) => p.status === "ready");
    if (readyPapers.length === 0) {
      toast.error("No papers uploaded", {
        description: "Upload at least one paper to ask questions.",
      });
      return;
    }

    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsSendingChat(true);

    try {
      // Build context from all paper chunks
      const allChunks = readyPapers.flatMap((p) =>
        p.chunks.map((chunk) => `[Paper: ${p.title}]\n${chunk}`)
      );

      // Take most relevant chunks (first 10 for context limit)
      const context = allChunks.slice(0, 10).join("\n\n---\n\n");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Here are excerpts from the researcher's uploaded papers:\n\n${context}\n\n---\n\nUser question: ${question}`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      // Read stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantMsg += decoder.decode(value, { stream: true });
          setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantMsg,
            };
            return updated;
          });
        }
      }

      setTimeout(
        () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error("Chat failed", { description: msg });
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // ── Filter papers by search ──
  const filteredPapers = searchQuery.trim()
    ? papers.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : papers;

  const readyCount = papers.filter((p) => p.status === "ready").length;

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
            {papers.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {papers.length}
              </Badge>
            )}
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
            onDrop={handleDrop}
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
              onChange={handleFileSelect}
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

          {/* Search (only show when papers exist) */}
          {papers.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search papers by title or filename..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Empty state */}
          {papers.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  No papers uploaded yet
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Upload your research papers (PDF) to build your personal
                  knowledge base. You can then ask AI questions across all your
                  papers.
                </p>
                <Button
                  className="mt-4 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Your First Paper
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Paper list */}
          {filteredPapers.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {filteredPapers.length} paper
                {filteredPapers.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
              {filteredPapers.map((paper) => (
                <Card
                  key={paper.id}
                  className={`group transition-all hover:shadow-sm ${
                    paper.status === "failed"
                      ? "border-destructive/30 bg-destructive/5"
                      : ""
                  }`}
                >
                  <CardContent className="flex items-start gap-4 py-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        paper.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : paper.status === "uploading"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {paper.status === "uploading" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : paper.status === "failed" ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium leading-snug truncate">
                            {paper.title}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <File className="h-3 w-3" />
                              {paper.fileName}
                            </span>
                            <span>{formatFileSize(paper.fileSize)}</span>
                            {paper.numPages > 0 && (
                              <span>
                                {paper.numPages} page
                                {paper.numPages !== 1 ? "s" : ""}
                              </span>
                            )}
                            {paper.wordCount > 0 && (
                              <span>
                                {paper.wordCount.toLocaleString()} words
                              </span>
                            )}
                          </div>
                          {paper.status === "failed" && paper.error && (
                            <p className="mt-1 text-xs text-destructive">
                              {paper.error}
                            </p>
                          )}
                          {paper.preview && (
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                              {paper.preview}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {paper.status === "ready" && (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <Badge variant="secondary" className="text-xs">
                                {paper.chunkCount} chunks
                              </Badge>
                            </>
                          )}
                          {paper.status === "uploading" && (
                            <Badge variant="outline" className="text-xs">
                              Uploading...
                            </Badge>
                          )}
                          {paper.status === "failed" && (
                            <Badge
                              variant="outline"
                              className="text-xs text-destructive border-destructive/30"
                            >
                              Failed
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deletePaper(paper.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Chat Tab ── */}
        <TabsContent value="chat" className="mt-6">
          <Card className="flex h-[calc(100vh-16rem)] flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Ask Your Literature
                <Badge variant="secondary" className="ml-2 text-xs">
                  {readyCount} paper{readyCount !== 1 ? "s" : ""} indexed
                </Badge>
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Sparkles className="h-10 w-10 text-muted-foreground/30" />
                    <h3 className="mt-4 text-lg font-semibold">
                      Ask anything about your papers
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      {readyCount > 0
                        ? `You have ${readyCount} paper${readyCount !== 1 ? "s" : ""} indexed. Ask a question to get AI-powered answers with citations.`
                        : "Upload papers in the Paper Library tab first, then come back here to ask questions."}
                    </p>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
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
                      {msg.role === "assistant" &&
                        msg.content === "" &&
                        isSendingChat && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Thinking...
                          </div>
                        )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={
                    readyCount > 0
                      ? "Ask a question across your papers..."
                      : "Upload papers first to start asking questions"
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1"
                  disabled={isSendingChat || readyCount === 0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="shrink-0"
                  onClick={sendChatMessage}
                  disabled={isSendingChat || !chatInput.trim() || readyCount === 0}
                >
                  {isSendingChat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                AI will search across your {readyCount} indexed paper
                {readyCount !== 1 ? "s" : ""} and provide cited answers.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
