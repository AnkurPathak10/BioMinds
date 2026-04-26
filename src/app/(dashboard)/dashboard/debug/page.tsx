"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Bug,
  Upload,
  ImageIcon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  FlaskConical,
  Loader2,
  X,
  TrendingDown,
  RotateCcw,
  History,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Diagnosis = {
  title: string;
  probability: string;
  explanation: string;
  suggestedFix: string;
  possibleCauses: string[];
};

export default function DebugPage() {
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [protocol, setProtocol] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  type PastSession = {
    id: string;
    description: string;
    expectedResult: string | null;
    imageCount: number;
    createdAt: string;
    diagnoses: Diagnosis[];
  };
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);

  // ── Fetch past debug sessions on mount ──
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/debug-sessions");
        if (!res.ok) return;
        const data = await res.json();
        setPastSessions(data.sessions || []);
      } catch {
        // silently fail
      }
    }
    fetchSessions();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File too large", {
            description: `${file.name} exceeds 10MB limit.`,
          });
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImages((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // ── Real AI diagnosis handler ──
  const handleDiagnose = async () => {
    if (!description.trim()) {
      toast.error("Please describe what went wrong");
      return;
    }

    setIsAnalyzing(true);
    setDiagnoses([]);
    setErrorMessage("");
    setAnalysisSteps([]);

    // Animate analysis steps progressively
    const steps = [
      "Reading experiment details...",
      "Analyzing uploaded images...",
      "Cross-referencing protocols...",
      "Generating diagnoses...",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisSteps((prev) => [...prev, steps[i]]);
    }

    try {
      const response = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: images,
          description: description.trim(),
          expectedResult: expectedResult.trim(),
          protocol: protocol.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      // Handle different response formats the AI might return
      const rawArray: Record<string, unknown>[] =
        data.diagnoses || data.diagnosis || data.results || [];

      // Normalize each diagnosis — AI may use different field names
      const diagnosisArray: Diagnosis[] = rawArray.map((d: Record<string, unknown>) => ({
        title:
          (d.title as string) ||
          (d.cause as string) ||
          (d.probableCause as string) ||
          (d.name as string) ||
          "Unknown Issue",
        probability:
          (d.probability as string) ||
          (d.confidence as string) ||
          (d.severity as string) ||
          (d.likelihood as string) ||
          "Medium",
        explanation:
          (d.explanation as string) ||
          (d.description as string) ||
          (d.details as string) ||
          "",
        suggestedFix:
          (d.suggestedFix as string) ||
          (d.suggested_fix as string) ||
          (d.fix as string) ||
          (d.solution as string) ||
          (d.recommendation as string) ||
          "",
        possibleCauses: Array.isArray(d.possibleCauses)
          ? (d.possibleCauses as string[])
          : Array.isArray(d.possible_causes)
          ? (d.possible_causes as string[])
          : Array.isArray(d.causes)
          ? (d.causes as string[])
          : [],
      }));

      if (diagnosisArray.length === 0) {
        throw new Error(
          "AI could not generate diagnoses. Please provide more detail."
        );
      }

      setDiagnoses(diagnosisArray);

      // Save session to DB
      try {
        const saveRes = await fetch("/api/debug-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            expectedResult: expectedResult.trim() || null,
            protocol: protocol.trim() || null,
            imageCount: images.length,
            diagnoses: diagnosisArray,
          }),
        });
        if (saveRes.ok) {
          const { session } = await saveRes.json();
          setPastSessions((prev) => [session, ...prev]);
        }
      } catch {
        // non-critical: diagnosis was already shown
      }

      toast.success("Diagnosis complete!", {
        description: `Found ${diagnosisArray.length} probable cause${diagnosisArray.length > 1 ? "s" : ""}.`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Debug error:", msg);
      setErrorMessage(msg);
      toast.error("Diagnosis failed", { description: msg });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Reset everything ──
  const handleReset = () => {
    setImages([]);
    setDescription("");
    setExpectedResult("");
    setProtocol("");
    setDiagnoses([]);
    setAnalysisSteps([]);
    setErrorMessage("");
  };

  const probabilityColor = (prob: string | undefined) => {
    const p = (prob || "medium").toLowerCase();
    if (p === "high" || p === "very high")
      return "text-red-500 dark:text-red-400";
    if (p === "medium" || p === "moderate")
      return "text-orange-500 dark:text-orange-400";
    return "text-yellow-500 dark:text-yellow-400";
  };

  const probabilityBg = (prob: string | undefined) => {
    const p = (prob || "medium").toLowerCase();
    if (p === "high" || p === "very high")
      return "bg-red-500/10 border-red-500/20";
    if (p === "medium" || p === "moderate")
      return "bg-orange-500/10 border-orange-500/20";
    return "bg-yellow-500/10 border-yellow-500/20";
  };

  const rankColor = (rank: number) => {
    if (rank === 1) return "bg-red-500/20 text-red-600 dark:text-red-400";
    if (rank === 2)
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
    return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
  };

  const hasResults = diagnoses.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-6 w-6 text-primary" />
            Experiment Debugger
          </h1>
          <p className="mt-1 text-muted-foreground">
            Upload failed results and get AI-powered diagnoses with ranked
            probable causes.
          </p>
        </div>
        {hasResults && (
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input form */}
        <div className="space-y-6">
          {/* Image upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-primary" />
                Upload Failed Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all hover:border-primary/50 hover:bg-primary/[0.02]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">
                  Drop gel images, blots, or plots
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PNG, JPG, TIFF up to 10MB each
                </p>
              </div>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="group relative h-20 w-20 overflow-hidden rounded-lg border"
                    >
                      <img
                        src={img}
                        alt={`Upload ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4 text-primary" />
                Describe the Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  What went wrong? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="e.g., Extraction of pigment from spinach leaves using acetone gave a very pale green extract instead of deep green."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Result</Label>
                <Input
                  placeholder="e.g., Deep green extract with visible chlorophyll pigments"
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Protocol Used (optional)</Label>
                <Textarea
                  placeholder="e.g., Grind spinach leaves in mortar with acetone, filter through cheesecloth..."
                  rows={3}
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                />
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleDiagnose}
                disabled={isAnalyzing || !description.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Diagnose Failure
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {/* Empty state */}
          {!hasResults && !isAnalyzing && !errorMessage && (
            <Card className="flex h-full items-center justify-center border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bug className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">
                  No Diagnosis Yet
                </h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Upload your failed result images and describe what went wrong.
                  AI will analyze like a senior scientist.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Analyzing state */}
          {isAnalyzing && (
            <Card className="flex h-full items-center justify-center">
              <CardContent className="py-16 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h3 className="mt-6 text-lg font-semibold">
                  AI is Analyzing...
                </h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  DeepMinds AI is examining your data, cross-referencing
                  protocols, and generating diagnoses.
                </p>
                <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                  {analysisSteps.map((step) => (
                    <div
                      key={step}
                      className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {step}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {errorMessage && !isAnalyzing && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-8 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
                <h3 className="mt-4 text-lg font-semibold">Analysis Failed</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground mx-auto">
                  {errorMessage}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setErrorMessage("");
                    handleDiagnose();
                  }}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Real AI Results */}
          {hasResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Diagnosis Results</h2>
                <Badge className="ml-auto">
                  {diagnoses.length} probable cause
                  {diagnoses.length > 1 ? "s" : ""}
                </Badge>
              </div>

              {diagnoses.map((d, index) => {
                const rank = index + 1;
                return (
                  <Card
                    key={index}
                    className={`border ${probabilityBg(d.probability)} transition-all hover:shadow-md`}
                  >
                    <CardContent className="py-5 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${rankColor(rank)}`}
                          >
                            #{rank}
                          </div>
                          <h3 className="font-semibold">{d.title}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <TrendingDown
                            className={`h-4 w-4 ${probabilityColor(d.probability)}`}
                          />
                          <span className={probabilityColor(d.probability)}>
                            {d.probability}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      {/* Explanation */}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {d.explanation}
                      </p>

                      {/* Possible Causes */}
                      {d.possibleCauses && d.possibleCauses.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Contributing Factors
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.possibleCauses.map((cause, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {cause}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fix */}
                      <div className="rounded-lg bg-primary/5 p-3">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                          <Lightbulb className="h-3.5 w-3.5" />
                          Suggested Fix
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {d.suggestedFix}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* ── Past Sessions History ── */}
      {pastSessions.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Past Diagnoses</h2>
            <Badge variant="secondary" className="ml-1 text-xs">
              {pastSessions.length}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastSessions.map((session) => (
              <Card
                key={session.id}
                className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => {
                  setDiagnoses(session.diagnoses);
                  setDescription(session.description);
                  setExpectedResult(session.expectedResult || "");
                }}
              >
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium line-clamp-2">
                      {session.description}
                    </p>
                    <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                      {session.diagnoses?.length || 0} causes
                    </Badge>
                  </div>
                  {session.diagnoses?.[0] && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      Top: {session.diagnoses[0].title}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
