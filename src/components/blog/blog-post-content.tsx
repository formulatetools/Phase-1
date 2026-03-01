import Image from 'next/image'
import Link from 'next/link'

/**
 * Renders Tiptap JSON content to HTML for public blog display.
 * Walks the JSON tree and renders React elements with proper styling.
 * Handles the custom worksheetEmbed node type.
 */

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

function renderMarks(text: string, marks?: Array<{ type: string; attrs?: Record<string, unknown> }>): React.ReactNode {
  if (!marks || marks.length === 0) return text

  let node: React.ReactNode = text
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        node = <strong>{node}</strong>
        break
      case 'italic':
        node = <em>{node}</em>
        break
      case 'underline':
        node = <u>{node}</u>
        break
      case 'strike':
        node = <s>{node}</s>
        break
      case 'code':
        node = <code className="rounded bg-primary-100 px-1 py-0.5 text-sm">{node}</code>
        break
      case 'link':
        node = (
          <a
            href={mark.attrs?.href as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:text-brand-dark underline"
          >
            {node}
          </a>
        )
        break
    }
  }
  return node
}

function renderNode(node: TiptapNode, index: number): React.ReactNode {
  const children = node.content?.map((child, i) => renderNode(child, i))

  switch (node.type) {
    case 'doc':
      return <>{children}</>
    case 'paragraph':
      return <p key={index}>{children}</p>
    case 'heading': {
      const level = (node.attrs?.level ?? 2) as number
      if (level === 2) return <h2 key={index}>{children}</h2>
      return <h3 key={index}>{children}</h3>
    }
    case 'bulletList':
      return <ul key={index}>{children}</ul>
    case 'orderedList':
      return <ol key={index}>{children}</ol>
    case 'listItem':
      return <li key={index}>{children}</li>
    case 'blockquote':
      return <blockquote key={index}>{children}</blockquote>
    case 'codeBlock':
      return (
        <pre key={index} className="rounded-lg bg-primary-900 p-4 text-sm text-primary-100 overflow-x-auto">
          <code>{children}</code>
        </pre>
      )
    case 'horizontalRule':
      return <hr key={index} />
    case 'text':
      return <span key={index}>{renderMarks(node.text || '', node.marks)}</span>
    case 'image':
      return (
        <figure key={index} className="my-4">
          <Image
            src={node.attrs?.src as string}
            alt={(node.attrs?.alt as string) || ''}
            width={768}
            height={432}
            className="rounded-xl w-full h-auto"
            sizes="(max-width: 768px) 100vw, 768px"
            loading="lazy"
          />
        </figure>
      )
    case 'worksheetEmbed':
      return (
        <div key={index} className="my-6 rounded-xl border border-brand/30 bg-brand-light p-5">
          <p className="text-xs font-medium text-brand-text uppercase tracking-wider mb-1">
            Related Worksheet
          </p>
          <h4 className="text-base font-semibold text-primary-900">
            {(node.attrs?.worksheetTitle as string) || 'Worksheet'}
          </h4>
          {node.attrs?.worksheetDescription ? (
            <p className="mt-1 text-sm text-primary-600 line-clamp-2">
              {node.attrs.worksheetDescription as string}
            </p>
          ) : null}
          <Link
            href={`/worksheets/${node.attrs?.worksheetSlug || ''}`}
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark transition-colors"
          >
            Try this worksheet
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )
    default:
      return children ? <div key={index}>{children}</div> : null
  }
}

export function BlogPostContent({ content }: { content: Record<string, unknown> }) {
  const doc = content as unknown as TiptapNode

  if (!doc || !doc.content || doc.content.length === 0) {
    return <p className="text-sm text-primary-400 italic">No content yet.</p>
  }

  return (
    <div className="prose prose-sm max-w-none prose-headings:text-primary-900 prose-p:text-primary-700 prose-a:text-brand prose-blockquote:border-brand prose-blockquote:text-primary-600">
      {renderNode(doc, 0)}
    </div>
  )
}
