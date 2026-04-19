'use client'

import React from 'react'

interface Props {
  content: string
}

/**
 * Affiche le Markdown des réponses IA de façon propre,
 * comme ChatGPT ou Gemini — sans étoiles ni # visibles.
 * Aucune dépendance externe.
 */
export function MarkdownMessage({ content }: Props) {
  if (!content || content === '...') {
    return <span className="opacity-60">{content}</span>
  }

  const lines  = content.split('\n')
  const result: React.ReactNode[] = []
  let   i = 0

  while (i < lines.length) {
    const raw     = lines[i]
    const trimmed = raw.trim()

    // Ligne vide
    if (!trimmed) {
      result.push(<div key={i} className="h-2" />)
      i++
      continue
    }

    // Titres ## ###
    if (trimmed.startsWith('### ')) {
      result.push(
        <p key={i} className="font-semibold text-sm mt-2 mb-0.5">
          {inline(trimmed.slice(4))}
        </p>
      )
      i++; continue
    }
    if (trimmed.startsWith('## ')) {
      result.push(
        <p key={i} className="font-bold text-sm mt-3 mb-1">
          {inline(trimmed.slice(3))}
        </p>
      )
      i++; continue
    }
    if (trimmed.startsWith('# ')) {
      result.push(
        <p key={i} className="font-bold text-base mt-3 mb-1">
          {inline(trimmed.slice(2))}
        </p>
      )
      i++; continue
    }

    // Liste à puces (- ou * ou •)
    if (trimmed.match(/^[-*•]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^[-*•]\s/)) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''))
        i++
      }
      result.push(
        <ul key={`ul-${i}`} className="space-y-1 my-1 ml-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
              <span>{inline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Liste numérotée
    if (trimmed.match(/^\d+\.\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      result.push(
        <ol key={`ol-${i}`} className="space-y-1 my-1 ml-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="text-emerald-400 font-mono text-xs shrink-0 mt-0.5 w-4">
                {j + 1}.
              </span>
              <span>{inline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Séparateur ---
    if (trimmed === '---' || trimmed === '***') {
      result.push(<hr key={i} className="border-slate-600/50 my-2" />)
      i++; continue
    }

    // Paragraphe normal
    result.push(
      <p key={i} className="text-sm leading-relaxed">
        {inline(trimmed)}
      </p>
    )
    i++
  }

  return <div className="space-y-1">{result}</div>
}

// ── Inline Markdown : **gras** *italique* `code` ─────────────
function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  // Regex qui capture **gras**, *italique*, `code` dans l'ordre
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0, m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))

    if (m[0].startsWith('**')) {
      parts.push(<strong key={m.index} className="font-semibold">{m[2]}</strong>)
    } else if (m[0].startsWith('*')) {
      parts.push(<em key={m.index} className="italic">{m[3]}</em>)
    } else {
      parts.push(
        <code key={m.index} className="bg-black/20 rounded px-1 font-mono text-xs">
          {m[4]}
        </code>
      )
    }
    last = m.index + m[0].length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}
