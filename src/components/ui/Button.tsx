'use client'

import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth, loading, disabled, children, className = '', ...props }, ref) => {
    const base = 'font-spy uppercase tracking-wider text-sm px-6 py-3 transition-colors duration-150 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none'
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-gold text-base',
      secondary: 'bg-transparent border border-border text-ink hover:border-gold',
      danger: 'bg-transparent border border-red-dark text-[#c94040]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="typewriter-cursor">PROCESSANDO</span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
