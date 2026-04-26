"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Mic,
  MicOff,
  NotebookPen,
  Search,
  Calendar,
  Tag,
  MoreHorizontal,
  Sparkles,
  Clock,
  FileText,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type NotebookEntry = {
  id: string;
  title: string;
  source: "voice" | "typed";
  tags: string[];
  hypothesis: string;
  materials: string;
  procedure: string;
  observations: string;
  results: string;
  conclusion: string;
  experimentDate: string;
  createdAt: string;
};



const emptyEntry = {
  title: "",
  hypothesis: "",
  materials: "",
  procedure: "",
  observations: "",
  results: "",
  conclusion: "",
  tags: "",
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export default function NotebookPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch entries from DB on mount ──
  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch("/api/entries");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mapped: NotebookEntry[] = (data.entries || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e: any) => ({
            id: e.id,
            title: e.title,
            source: e.source || "typed",
            tags: e.tags || [],
            hypothesis: e.hypothesis || "",
            materials: e.materials || "",
            procedure: e.procedure || "",
            observations: e.observations || "",
            results: e.results || "",
            conclusion: e.conclusion || "",
            experimentDate: e.createdAt?.split("T")[0] || "",
            createdAt: e.createdAt,
          })
        );
        setEntries(mapped);
      } catch {
        // silently fail — user sees empty state
      } finally {
        setIsLoading(false);
      }
    }
    fetchEntries();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [newEntry, setNewEntry] = useState(emptyEntry);
  const [entrySource, setEntrySource] = useState<"typed" | "voice">("typed");
  const [rawVoiceText, setRawVoiceText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ── Start voice recording ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // collect data every second
      setIsRecording(true);
      toast.info("Recording started", {
        description: "Speak your experiment notes clearly.",
      });
    } catch {
      toast.error("Microphone access denied", {
        description: "Please allow microphone access in your browser settings.",
      });
    }
  }, []);

  // ── Stop recording & process with AI ──
  const stopAndProcess = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    setIsRecording(false);
    setIsProcessingVoice(true);

    // Wait for the recorder to fully stop and collect final data
    const audioBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        resolve(blob);
      };
      mediaRecorder.stop();
      // Stop all tracks to release the microphone
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });

    try {
      toast.info("Processing your voice notes...", {
        description: "AI is transcribing and structuring your notes.",
      });

      // Send audio to transcription API
      const formData = new FormData();
      const ext = audioBlob.type.includes("webm") ? "webm" : "mp4";
      formData.append("audio", audioBlob, `recording.${ext}`);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const { rawText, structured } = data;

      // Store raw transcription
      setRawVoiceText(rawText || "");

      // Pre-fill the form with AI-structured fields
      setNewEntry({
        title: structured?.title || "",
        hypothesis: structured?.hypothesis || "",
        materials: Array.isArray(structured?.materials)
          ? structured.materials.join(", ")
          : structured?.materials || "",
        procedure: structured?.procedure || "",
        observations: structured?.observations || "",
        results: structured?.results || "",
        conclusion: structured?.conclusion || "",
        tags: Array.isArray(structured?.tags)
          ? structured.tags.join(", ")
          : structured?.tags || "",
      });

      setEntrySource("voice");
      setShowNewEntry(true);

      toast.success("Voice notes processed!", {
        description: "Review the structured fields and click Save Entry.",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Transcription error:", msg);
      toast.error("Failed to process voice recording", {
        description: msg,
      });
    } finally {
      setIsProcessingVoice(false);
    }
  }, []);

  // ── Save entry handler ──
  const handleSaveEntry = async () => {
    // Validation
    if (!newEntry.title.trim()) {
      toast.error("Please enter an experiment title");
      return;
    }

    setIsSaving(true);

    try {
      const tags = newEntry.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Save to database
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEntry.title.trim(),
          source: entrySource,
          tags,
          hypothesis: newEntry.hypothesis.trim() || null,
          materials: newEntry.materials.trim() || null,
          procedure: newEntry.procedure.trim() || null,
          observations: newEntry.observations.trim() || null,
          results: newEntry.results.trim() || null,
          conclusion: newEntry.conclusion.trim() || null,
          rawVoiceText: rawVoiceText || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Save failed");
      }

      const { entry: savedEntry } = await res.json();

      const entry: NotebookEntry = {
        id: savedEntry.id,
        title: savedEntry.title,
        source: savedEntry.source || entrySource,
        tags: savedEntry.tags || tags,
        hypothesis: savedEntry.hypothesis || "",
        materials: savedEntry.materials || "",
        procedure: savedEntry.procedure || "",
        observations: savedEntry.observations || "",
        results: savedEntry.results || "",
        conclusion: savedEntry.conclusion || "",
        experimentDate: savedEntry.createdAt?.split("T")[0] || "",
        createdAt: savedEntry.createdAt,
      };

      setEntries((prev) => [entry, ...prev]);

      setNewEntry(emptyEntry);
      setEntrySource("typed");
      setRawVoiceText("");
      setShowNewEntry(false);

      toast.success("New entry added!", {
        description: `"${entry.title}" saved to your notebook.`,
      });
    } catch {
      toast.error("Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete entry handler ──
  const handleDeleteEntry = async (entryId: string) => {
    try {
      const res = await fetch(`/api/entries?id=${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  // ── Filter entries by search ──
  const filteredEntries = searchQuery.trim()
    ? entries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.hypothesis.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.results.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : entries;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <NotebookPen className="h-6 w-6 text-primary" />
            AI Lab Notebook
          </h1>
          <p className="mt-1 text-muted-foreground">
            Record experiments with voice or text. AI structures your notes
            automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Voice Record Button */}
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={() => {
              if (isRecording) {
                stopAndProcess();
              } else {
                startRecording();
              }
            }}
            disabled={isProcessingVoice}
            className={`gap-2 ${isRecording ? "animate-pulse" : ""}`}
          >
            {isProcessingVoice ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isRecording ? (
              <>
                <MicOff className="h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Voice Entry
              </>
            )}
          </Button>

          {/* New Entry Dialog */}
          <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" />
              New Entry
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {entrySource === "voice" ? "Review Voice Entry" : "New Notebook Entry"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Raw transcription banner for voice entries */}
                {entrySource === "voice" && rawVoiceText && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      Raw Voice Transcription
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      &ldquo;{rawVoiceText}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      AI has structured this into the fields below. Review and edit before saving.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Experiment Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., PCR Amplification of BRCA1 Exon 11"
                    value={newEntry.title}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., PCR, BRCA1, Gel Electrophoresis"
                    value={newEntry.tags}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, tags: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hypothesis">Hypothesis</Label>
                  <Textarea
                    id="hypothesis"
                    placeholder="What do you expect to observe?"
                    rows={2}
                    value={newEntry.hypothesis}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, hypothesis: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materials">Materials</Label>
                  <Textarea
                    id="materials"
                    placeholder="List reagents, equipment, and concentrations used"
                    rows={3}
                    value={newEntry.materials}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, materials: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="procedure">Procedure</Label>
                  <Textarea
                    id="procedure"
                    placeholder="Step-by-step protocol followed"
                    rows={4}
                    value={newEntry.procedure}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, procedure: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="observations">Observations</Label>
                    <Textarea
                      id="observations"
                      placeholder="What did you observe during the experiment?"
                      rows={3}
                      value={newEntry.observations}
                      onChange={(e) =>
                        setNewEntry({
                          ...newEntry,
                          observations: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="results">Results</Label>
                    <Textarea
                      id="results"
                      placeholder="Quantitative or qualitative outcomes"
                      rows={3}
                      value={newEntry.results}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, results: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conclusion">Conclusion</Label>
                  <Textarea
                    id="conclusion"
                    placeholder="Summary & next steps"
                    rows={2}
                    value={newEntry.conclusion}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, conclusion: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewEntry(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={handleSaveEntry}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Save Entry
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Voice recording indicator */}
      {(isRecording || isProcessingVoice) && (
        <Card className={isProcessingVoice ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="relative flex h-10 w-10 items-center justify-center">
              {isProcessingVoice ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
                  <Mic className="relative h-5 w-5 text-destructive" />
                </>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${isProcessingVoice ? "text-primary" : "text-destructive"}`}>
                {isProcessingVoice ? "Processing with AI..." : "Recording..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {isProcessingVoice
                  ? "Transcribing and structuring your notes. This may take a few seconds."
                  : "Speak your experiment notes. AI will structure them automatically when you stop."}
              </p>
            </div>
            {isRecording && (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopAndProcess}
              >
                <MicOff className="mr-2 h-4 w-4" />
                Stop & Process
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search entries... (by title, hypothesis, results, or tags)"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Entry count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredEntries.length} entr{filteredEntries.length === 1 ? "y" : "ies"}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Empty state */}
      {filteredEntries.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <NotebookPen className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No entries found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search term."
                : "Create your first notebook entry using the \"New Entry\" button above."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Entries list */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <Card
            key={entry.id}
            className="group transition-all hover:shadow-md hover:shadow-primary/5"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-base leading-snug">
                    {entry.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {entry.experimentDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.createdAt}
                    </span>
                    <span className="flex items-center gap-1">
                      {entry.source === "voice" ? (
                        <Mic className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {entry.source === "voice"
                        ? "Voice entry"
                        : "Typed entry"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteEntry(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="mr-1 h-2.5 w-2.5" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              <Tabs defaultValue="hypothesis" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="hypothesis" className="text-xs">
                    Hypothesis
                  </TabsTrigger>
                  <TabsTrigger value="procedure" className="text-xs">
                    Procedure
                  </TabsTrigger>
                  <TabsTrigger value="results" className="text-xs">
                    Results
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="text-xs">
                    Materials
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="hypothesis"
                  className="mt-3 text-sm text-muted-foreground"
                >
                  {entry.hypothesis || <span className="italic">No hypothesis recorded</span>}
                </TabsContent>
                <TabsContent
                  value="procedure"
                  className="mt-3 whitespace-pre-line text-sm text-muted-foreground"
                >
                  {entry.procedure || <span className="italic">No procedure recorded</span>}
                </TabsContent>
                <TabsContent
                  value="results"
                  className="mt-3 text-sm text-muted-foreground"
                >
                  {entry.results || <span className="italic">No results recorded</span>}
                </TabsContent>
                <TabsContent
                  value="materials"
                  className="mt-3 text-sm text-muted-foreground"
                >
                  {entry.materials || <span className="italic">No materials recorded</span>}
                </TabsContent>
              </Tabs>

              {(entry.observations || entry.conclusion) && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    {entry.observations && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Observations</p>
                        <p className="text-muted-foreground">{entry.observations}</p>
                      </div>
                    )}
                    {entry.conclusion && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Conclusion</p>
                        <p className="text-muted-foreground">{entry.conclusion}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
