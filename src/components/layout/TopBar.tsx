interface TopBarProps {
  title?: string
  subtitle?: React.ReactNode
  right?: React.ReactNode
  left?: React.ReactNode
}

export function TopBar({ title = 'S.O.M.B.R.A', subtitle, right, left }: TopBarProps) {
  return (
    <header className="h-12 bg-base border-b border-border flex items-center px-4 justify-between">
      <div className="flex items-center gap-2">
        {left}
        <span className="font-spy text-ink uppercase tracking-wider text-sm">
          {title}
        </span>
      </div>
      {(right || subtitle) ? (
        <span className="font-mono text-ink-muted text-xs">{right ?? subtitle}</span>
      ) : null}
    </header>
  )
}
