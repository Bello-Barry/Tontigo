'use client'
import { Component, type ReactNode } from 'react'
import { Mic } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AudioErrorBoundary extends Component<Props, State> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Audio component error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <button
          className="p-2.5 rounded-xl bg-slate-700 opacity-50 cursor-not-allowed"
          title="Audio indisponible"
          disabled
        >
          <Mic className="w-4 h-4 text-slate-400" />
        </button>
      )
    }
    return this.props.children
  }
}
