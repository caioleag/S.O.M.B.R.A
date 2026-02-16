interface CardProps {
  children: React.ReactNode
  active?: boolean
  className?: string
}

export function Card({ children, active, className = '' }: CardProps) {
  return (
    <div
      className={`bg-surface p-4 rounded-sm transition-shadow ${
        active
          ? 'border border-border-gold shadow-[0_0_18px_rgba(201,162,39,0.07)]'
          : 'border border-border'
      } ${className}`}
    >
      {children}
    </div>
  )
}
