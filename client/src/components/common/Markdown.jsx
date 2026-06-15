import ReactMarkdown from 'react-markdown';

// Renders the assistant's grounded answer. Links open in a new tab; everything
// else is styled through the .prose-answer rules in index.css.
export default function Markdown({ children }) {
  return (
    <div className="prose-answer">
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}
