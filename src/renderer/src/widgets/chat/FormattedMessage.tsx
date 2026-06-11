import { Fragment, type ReactNode } from 'react'

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g

const renderInline = (text: string): ReactNode[] =>
  text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-black/20 px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (
      (part.startsWith('*') && part.endsWith('*')) ||
      (part.startsWith('_') && part.endsWith('_'))
    ) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <Fragment key={i}>{part}</Fragment>
  })

export const FormattedMessage = ({ content }: { content: string }) => (
  <>
    {content.split('\n').map((line, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        {renderInline(line)}
      </Fragment>
    ))}
  </>
)
