import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchService } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import SearchBar from '../components/library/SearchBar';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounced = useDebounce(query, 350);

  useEffect(() => {
    const q = debounced.trim();
    setParams(q ? { q } : {}, { replace: true });
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    let active = true;
    setLoading(true);
    searchService
      .query(q)
      .then(({ data }) => active && setResults(data.results || []))
      .catch(() => active && setResults([]))
      .finally(() => {
        if (active) {
          setLoading(false);
          setSearched(true);
        }
      });
    return () => {
      active = false;
    };
  }, [debounced, setParams]);

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Search the law</h1>
      <SearchBar value={query} onChange={setQuery} autoFocus placeholder="Search the Constitution and Acts…" />

      <div className="mt-6">
        {loading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" />
          </div>
        ) : searched && results.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No matching provisions"
            description="Try different keywords, or ask the assistant a full question instead."
          >
            <Link to={`/chat?q=${encodeURIComponent(query)}`} className="text-primary-700 hover:underline">
              Ask the assistant about “{query}” →
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {results.length > 0 && (
              <p className="text-sm text-gray-500">{results.length} results</p>
            )}
            {results.map((r) => (
              <Link
                key={`${r.documentSlug}-${r.refKey}`}
                to={`/library/${r.documentSlug}/${r.refKey}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary-700">{r.ref}</span>
                  <Badge color="gray">{r.document}</Badge>
                </div>
                <p className="mt-1 font-medium text-gray-900">{r.title}</p>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{r.snippet}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
