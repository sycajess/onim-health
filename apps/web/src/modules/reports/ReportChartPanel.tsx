import type { ReactNode } from 'react'

type ReportChartPanelProps = {
  title: string
  explanation: string
  children: ReactNode
}

export function ReportChartPanel({ title, explanation, children }: ReportChartPanelProps) {
  return (
    <div className="rpt-chart-panel">
      <div className="rpt-chart-panel__chart">{children}</div>
      <div className="rpt-chart-panel__copy">
        <h4>{title}</h4>
        <p>{explanation}</p>
      </div>
    </div>
  )
}
