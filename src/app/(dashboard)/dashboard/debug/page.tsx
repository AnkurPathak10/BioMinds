"use client";

import { useState, useRef } from "react";
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
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Demo diagnoses
const demoDiagnoses = [
  {
    rank: 1,
    probableCause: "Antibody Lot Variability",
    explanation:
      "The anti-p53 antibody lot #4521 (DO-1 clone) has shown inconsistent binding affinity in recent batches. Multiple labs have reported weak or absent signal with this lot when used at the standard 1:1000 dilution.",
    suggestedFix:
      "Try increasing antibody concentration to 1:500, or request a replacement lot from the supplier. Lot #4519 has been verified to work well.",
    evidenceSource: "Community reports + Literature",
    confidenceScore: 0.87,
  },
  {
    rank: 2,
    probableCause: "Transfer Buffer pH Drift",
    explanation:
      "Tris-Glycine transfer buffer pH may have drifted above 8.5 during extended transfer. This causes poor protein retention on PVDF membrane, especially for proteins >40kDa.",
    suggestedFix:
      "Freshly prepare transfer buffer and verify pH is 8.3 ± 0.1 before use. Consider wet transfer at 100V for 90min instead of semi-dry.",
    evidenceSource: "Your past experiments",
    confidenceScore: 0.65,
  },
  {
    rank: 3,
    probableCause: "Insufficient Blocking",
    explanation:
      "Your blocking step (3% BSA, 30min) may be insufficient for this antibody-membrane combination. DO-1 antibody is known to show high background with short blocking times.",
    suggestedFix:
      "Increase blocking time to 1 hour or switch to 5% non-fat milk. Add 0.1% Tween-20 to blocking solution.",
    evidenceSource: "Literature",
    confidenceScore: 0.42,
  },
];

export default function DebugPage() {
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [protocol, setProtocol] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImages((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDiagnose = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2500);
  };

  const confidenceColor = (score: number) => {
    if (score >= 0.7) return "text-red-500 dark:text-red-400";
    if (score >= 0.5) return "text-orange-500 dark:text-orange-400";
    return "text-yellow-500 dark:text-yellow-400";
  };

  const confidenceBg = (score: number) => {
    if (score >= 0.7) return "bg-red-500/10 border-red-500/20";
    if (score >= 0.5) return "bg-orange-500/10 border-orange-500/20";
    return "bg-yellow-500/10 border-yellow-500/20";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
                    <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border">
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
                <Label>What went wrong?</Label>
                <Textarea
                  placeholder="e.g., No bands visible on Western Blot for p53 in treated samples. Expected a clear band at 53kDa."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Result</Label>
                <Input
                  placeholder="e.g., Clear band at 53kDa, ~3-fold increase vs control"
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Protocol Used (optional)</Label>
                <Textarea
                  placeholder="e.g., Standard Western Blot protocol - 10% SDS-PAGE, PVDF membrane, anti-p53 DO-1 1:1000..."
                  rows={3}
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                />
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleDiagnose}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing with GPT-4o Vision...
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
          {!showResults && !isAnalyzing && (
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

          {isAnalyzing && (
            <Card className="flex h-full items-center justify-center">
              <CardContent className="py-16 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h3 className="mt-6 text-lg font-semibold">
                  AI is Analyzing...
                </h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  GPT-4o Vision is examining your images, cross-referencing your
                  past experiments, and searching published literature.
                </p>
                <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                  {[
                    "Reading image data...",
                    "Cross-referencing protocols...",
                    "Searching literature...",
                  ].map((step, i) => (
                    <div
                      key={step}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {step}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {showResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Diagnosis Results
                </h2>
                <Badge className="ml-auto">
                  {demoDiagnoses.length} probable causes
                </Badge>
              </div>

              {demoDiagnoses.map((d) => (
                <Card
                  key={d.rank}
                  className={`border ${confidenceBg(d.confidenceScore)} transition-all hover:shadow-md`}
                >
                  <CardContent className="py-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                            d.rank === 1
                              ? "bg-red-500/20 text-red-600 dark:text-red-400"
                              : d.rank === 2
                              ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                              : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          }`}
                        >
                          #{d.rank}
                        </div>
                        <h3 className="font-semibold">{d.probableCause}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <TrendingDown
                          className={`h-4 w-4 ${confidenceColor(
                            d.confidenceScore
                          )}`}
                        />
                        <span className={confidenceColor(d.confidenceScore)}>
                          {Math.round(d.confidenceScore * 100)}%
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Explanation */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {d.explanation}
                    </p>

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

                    {/* Source */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {d.evidenceSource}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
