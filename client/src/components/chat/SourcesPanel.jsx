import CitationCard from './CitationCard';

export default function SourcesPanel({ sources = [] }) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Sources ({sources.length})
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sources.map((source, i) => (
          <CitationCard key={`${source.documentSlug}-${source.refKey}`} source={source} index={i} />
        ))}
      </div>
    </div>
  );
}
