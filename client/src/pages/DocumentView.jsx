import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { lawService } from '../services/api';
import Breadcrumbs from '../components/library/Breadcrumbs';
import ArticleCard from '../components/library/ArticleCard';
import SearchBar from '../components/library/SearchBar';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function DocumentView() {
  const { slug } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    lawService
      .get(slug)
      .then(({ data }) => active && setDoc(data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  const sections = useMemo(() => {
    if (!doc) return [];
    const term = filter.trim().toLowerCase();
    if (!term) return doc.sections;
    return doc.sections
      .map((section) => ({
        ...section,
        entries: section.entries.filter(
          (e) =>
            e.ref.toLowerCase().includes(term) ||
            e.title.toLowerCase().includes(term) ||
            e.text.toLowerCase().includes(term),
        ),
      }))
      .filter((section) => section.entries.length > 0);
  }, [doc, filter]);

  if (loading) {
    return (
      <div className="container-page py-20 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon="⚠️"
          title="Document not found"
          description="This law may not exist in the library."
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Breadcrumbs
        items={[
          { label: 'Library', to: '/library' },
          { label: doc.document },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{doc.document}</h1>
        {doc.citation && <p className="mt-1 text-sm text-gray-400">{doc.citation}</p>}
        <p className="mt-2 max-w-3xl text-gray-600">{doc.description}</p>
        <p className="mt-2 text-xs font-medium text-gray-400">
          {doc.entryCount} provisions
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <SearchBar
          value={filter}
          onChange={setFilter}
          placeholder="Filter within this document…"
        />
      </div>

      {sections.length === 0 ? (
        <EmptyState icon="🔍" title="No provisions match your filter" />
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.group}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-700">
                {section.group}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.entries.map((entry) => (
                  <ArticleCard key={entry.refKey} slug={slug} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
