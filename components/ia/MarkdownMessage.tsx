'use client'

export function MarkdownMessage({ content }: { content: string }) {
  if (!content) return null

  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Ligne vide
    if (!line) { nodes.push(<div key={i} className="h-1.5" />); i++; continue }

    // Titres
    if (line.startsWith('### ')) {
      nodes.push(<p key={i} className="font-semibold text-sm mt-2">{renderInline(line.slice(4))}</p>)
      i++; continue
    }
    if (line.startsWith('## ') || line.startsWith('# ')) {
      const text = line.startsWith('## ') ? line.slice(3) : line.slice(2)
      nodes.push(<p key={i} className="font-bold text-sm mt-2">{renderInline(text)}</p>)
      i++; continue
    }

    // Liste à puces — collecter tous les items consécutifs
    if (/^[-*•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''))
        i++
      }
      nodes.push(
        <ul key={`ul${i}`} className="my-1 space-y-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="text-emerald-400 shrink-0 mt-0.5 text-xs">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Liste numérotée
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      nodes.push(
        <ol key={`ol${i}`} className="my-1 space-y-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="text-emerald-400 shrink-0 font-mono text-xs mt-0.5 w-4">{j + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Séparateur
    if (line === '---') {
      nodes.push(<hr key={i} className="border-slate-700 my-2" />)
      i++; continue
    }

    // Paragraphe normal
    nodes.push(<p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>)
    i++
  }

  return <div className="space-y-0.5">{nodes}</div>
}

function renderInline(text: string): React.ReactNode {
  // Regex : **gras** | *italique* | `code`
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g
  const parts: React.ReactNode[] = []
  let last = 0, m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1] !== undefined)
      parts.push(<strong key={m.index} className="font-semibold">{m[1]}</strong>)
    else if (m[2] !== undefined)
      parts.push(<em key={m.index} className="italic opacity-90">{m[2]}</em>)
    else
      parts.push(<code key={m.index} className="bg-black/20 rounded px-1 font-mono text-xs">{m[3]}</code>)
    last = m.index + m[0].length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}
