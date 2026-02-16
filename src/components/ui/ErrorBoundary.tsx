'use client'

import { Component, ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}
interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <p className="font-spy text-[#c94040] uppercase tracking-wider text-lg">
            TRANSMISSÃO INTERROMPIDA
          </p>
          <p className="text-ink-muted text-sm text-center">
            {this.state.error?.message ?? 'Ocorreu um erro inesperado na operação.'}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            TENTAR NOVAMENTE
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
