interface TopBarProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  right?: React.ReactNode
  left?: React.ReactNode
}

export function TopBar({ title = 'S.O.M.B.R.A', subtitle, right, left }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 h-12 bg-[#0c0a07] border-b border-[#1e1a12] flex items-center px-3 justify-between">
      <div className="flex items-center gap-1.5 min-w-0">
        {left}
        <span className="font-spy text-ink tracking-wider text-sm truncate leading-none">
          {title}
        </span>
      </div>
      {right ? (
        right
      ) : subtitle ? (
        <span className="font-spy text-[10px] tracking-[0.18em] text-ink-faint uppercase shrink-0">
          {subtitle}
        </span>
      ) : null}
    </header>
  )
}
