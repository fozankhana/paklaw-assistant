import { useEffect, useState } from 'react';
import { lawService } from '../services/api';
import LawCard from '../components/library/LawCard';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function Library() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    lawService
      .list()
      .then(({ data }) => active && setDocuments(data.documents || []))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Law Library</h1>
        <p className="mt-1 text-gray-500">
          Browse the Constitution and key statutes of Pakistan, organised by provision.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load the library"
          description="Please make sure the server is running and refresh the page."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <LawCard key={doc.slug} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
