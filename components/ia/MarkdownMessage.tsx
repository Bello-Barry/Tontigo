'use client'
import React from 'react'

interface Props {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: Props) {
  if (!content) return null

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      elements.push(<div key={i} className="h-1" />)
      i++
      continue
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^#{2,3}\s/, '')
      elements.push(
        <p key={i} className="font-bold text-sm mt-2 mb-1">{parseInline(text)}</p>
      )
      i++
      continue
    }

    if (trimmed.match(/^[-*•]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^[-*•]\s/)) {
        items.push(lines[i].trim().replace(/^[-*•]\s/, ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 my-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (trimmed.match(/^\d+\.\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1 my-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono text-xs mt-0.5 shrink-0 w-4">{j + 1}.</span>
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={i} className="border-slate-600 my-2" />)
      i++
      continue
    }

    elements.push(
      <p key={i} className="leading-relaxed">{parseInline(trimmed)}</p>
    )
    i++
  }

  return <div className="space-y-1 text-sm">{elements}</div>
}

function parseInline(text: string): React.ReactNode {
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[1])
      parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    else if (match[3])
      parts.push(<em key={match.index} className="italic opacity-90">{match[4]}</em>)
    else if (match[5])
      parts.push(
        <code key={match.index} className="bg-black/20 rounded px-1 py-0.5 font-mono text-xs">
          {match[6]}
        </code>
      )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length === 0 ? text : parts
}
