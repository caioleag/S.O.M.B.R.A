interface CardProps {
  children: React.ReactNode
  active?: boolean
  className?: string
}

export function Card({ children, active, className = '' }: CardProps) {
  return (
    <div
      className={`bg-surface p-4 rounded-sm ${
        active ? 'border border-border-gold' : 'border border-border'
      } ${className}`}
    >
      {children}
    </div>
  )
}
