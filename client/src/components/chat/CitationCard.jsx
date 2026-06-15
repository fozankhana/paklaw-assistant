import { Link } from 'react-router-dom';

export default function CitationCard({ source, index }) {
  return (
    <Link
      to={`/library/${source.documentSlug}/${source.refKey}`}
      className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-primary-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-2">
        {typeof index === 'number' && (
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
            {index + 1}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary-800 truncate">
            {source.ref}
            {source.exactRef && (
              <span className="ml-1.5 align-middle text-[10px] font-medium text-primary-500">
                exact match
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 truncate">{source.document}</p>
          {source.title && (
            <p className="mt-1 text-xs text-gray-600 line-clamp-2">{source.title}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
