"use client";

import { useState } from "react";
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

// Demo notebook entries for UI preview
const demoEntries = [
  {
    id: "1",
    title: "CRISPR Cas9 Transfection - HEK293T",
    source: "voice" as const,
    tags: ["CRISPR", "HEK293T", "Transfection"],
    hypothesis:
      "Lipofectamine 3000 will achieve >70% transfection efficiency in HEK293T cells at a 2:1 reagent:DNA ratio.",
    procedure:
      "1. Seeded 2×10⁵ HEK293T cells in 6-well plate 24h prior\n2. Prepared Cas9-GFP plasmid at 2.5µg/well\n3. Mixed with Lipofectamine 3000 at 2:1 ratio\n4. Added complex to cells, incubated 48h at 37°C, 5% CO₂",
    results:
      "GFP expression observed via fluorescence microscopy. Estimated ~65% efficiency based on GFP+ cells.",
    experimentDate: "2026-04-22",
    createdAt: "2 days ago",
  },
  {
    id: "2",
    title: "Western Blot - p53 Expression",
    source: "typed" as const,
    tags: ["Western Blot", "p53", "MCF-7"],
    hypothesis:
      "Doxorubicin treatment (1µM, 24h) will upregulate p53 protein expression in MCF-7 cells.",
    procedure:
      "1. Treated MCF-7 cells with 1µM doxorubicin for 24h\n2. Lysed cells in RIPA buffer with protease inhibitors\n3. Ran 10% SDS-PAGE, transferred to PVDF membrane\n4. Probed with anti-p53 (DO-1) 1:1000, anti-β-actin 1:5000",
    results:
      "Clear band at 53kDa in treated samples. ~3-fold increase vs untreated control after normalization to β-actin.",
    experimentDate: "2026-04-20",
    createdAt: "4 days ago",
  },
];

export default function NotebookPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: "",
    hypothesis: "",
    materials: "",
    procedure: "",
    observations: "",
    results: "",
    conclusion: "",
  });

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
            onClick={() => setIsRecording(!isRecording)}
            className={`gap-2 ${isRecording ? "animate-pulse" : ""}`}
          >
            {isRecording ? (
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
                  New Notebook Entry
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Experiment Title</Label>
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
                  >
                    Cancel
                  </Button>
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Save Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Voice recording indicator */}
      {isRecording && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
              <Mic className="relative h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-destructive">Recording...</p>
              <p className="text-sm text-muted-foreground">
                Speak your experiment notes. AI will structure them
                automatically when you stop.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsRecording(false)}
            >
              <MicOff className="mr-2 h-4 w-4" />
              Stop & Process
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search entries... (semantic search powered by AI)"
          className="pl-10"
        />
      </div>

      {/* Entries list */}
      <div className="space-y-4">
        {demoEntries.map((entry) => (
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="mr-1 h-2.5 w-2.5" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <Separator />

              <Tabs defaultValue="hypothesis" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hypothesis" className="text-xs">
                    Hypothesis
                  </TabsTrigger>
                  <TabsTrigger value="procedure" className="text-xs">
                    Procedure
                  </TabsTrigger>
                  <TabsTrigger value="results" className="text-xs">
                    Results
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="hypothesis"
                  className="mt-3 text-sm text-muted-foreground"
                >
                  {entry.hypothesis}
                </TabsContent>
                <TabsContent
                  value="procedure"
                  className="mt-3 whitespace-pre-line text-sm text-muted-foreground"
                >
                  {entry.procedure}
                </TabsContent>
                <TabsContent
                  value="results"
                  className="mt-3 text-sm text-muted-foreground"
                >
                  {entry.results}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
