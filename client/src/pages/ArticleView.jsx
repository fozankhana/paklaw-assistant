import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { lawService } from '../services/api';
import Breadcrumbs from '../components/library/Breadcrumbs';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function ArticleView() {
  const { slug, refKey } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    lawService
      .getEntry(slug, refKey)
      .then(({ data }) => active && setEntry(data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug, refKey]);

  const copyText = () => {
    if (!entry) return;
    navigator.clipboard
      ?.writeText(`${entry.document} — ${entry.ref}: ${entry.title}\n\n${entry.text}`)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Could not copy'));
  };

  if (loading) {
    return (
      <div className="container-page py-20 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon="⚠️"
          title="Provision not found"
          description="This Article or Section is not in the library."
        >
          <Link to="/library" className="text-primary-700 hover:underline">
            ← Back to the library
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <Breadcrumbs
        items={[
          { label: 'Library', to: '/library' },
          { label: entry.document, to: `/library/${slug}` },
          { label: entry.ref },
        ]}
      />

      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {entry.group && (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
            {entry.group}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {entry.ref}
          <span className="block text-lg font-semibold text-gray-700">{entry.title}</span>
        </h1>

        <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-gray-800">
          {entry.text}
        </p>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
          <Link to={`/chat?q=${encodeURIComponent(`Explain ${entry.ref} of the ${entry.document}`)}`}>
            <Button size="sm">Ask about this</Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={copyText}>
            Copy text
          </Button>
        </div>
      </article>

      <div className="mt-5 flex items-center justify-between text-sm">
        {entry.prev ? (
          <Link
            to={`/library/${slug}/${entry.prev.refKey}`}
            className="text-primary-700 hover:underline"
          >
            ← {entry.prev.ref}
          </Link>
        ) : (
          <span />
        )}
        {entry.next ? (
          <Link
            to={`/library/${slug}/${entry.next.refKey}`}
            className="text-primary-700 hover:underline"
          >
            {entry.next.ref} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
