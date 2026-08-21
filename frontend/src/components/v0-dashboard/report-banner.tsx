import { useState } from "react"
import { FileText, Download, Table, Share2, ArrowUpRight, Check } from "lucide-react"
import { Reveal } from "@/components/v0-ui/surface"
import { FxButton } from "@/components/v0-ui/fx-button"
import { useToast } from "@/components/v0-ui/toast"

export function ReportBanner() {
  const { toast } = useToast()
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  const generate = () => {
    setGenerating(true)
    setDone(false)
    setTimeout(() => {
      setGenerating(false)
      setDone(true)
      toast({
        tone: "success",
        title: "Report generated",
        description: "Your AI-written August financial summary is ready to download.",
      })
      setTimeout(() => setDone(false), 3000)
    }, 1600)
  }

  return (
    <Reveal>
      <div className="flex flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <FileText className="size-6" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Generate financial report</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Export an AI-written summary of your finances — cash flow, category breakdowns, and next-month
              recommendations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <FxButton variant="outline" size="sm" onClick={() => toast({ tone: "info", title: "Exporting PDF" })}>
            <Download className="size-4" /> PDF
          </FxButton>
          <FxButton variant="outline" size="sm" onClick={() => toast({ tone: "info", title: "Exporting CSV" })}>
            <Table className="size-4" /> CSV
          </FxButton>
          <FxButton variant="outline" size="sm" onClick={() => toast({ tone: "info", title: "Share link copied" })}>
            <Share2 className="size-4" /> Share
          </FxButton>
          <FxButton onClick={generate} loading={generating} className="group">
            {done ? (
              <>
                <Check className="size-4" /> Ready
              </>
            ) : (
              <>
                Generate report
                <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </>
            )}
          </FxButton>
        </div>
      </div>
    </Reveal>
  )
}
