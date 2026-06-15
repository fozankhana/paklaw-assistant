import { Link } from 'react-router-dom';

export default function ArticleCard({ slug, entry }) {
  return (
    <Link
      to={`/library/${slug}/${entry.refKey}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-primary-700">{entry.ref}</span>
      </div>
      <p className="mt-0.5 font-medium text-gray-900 text-[15px]">{entry.title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{entry.text}</p>
    </Link>
  );
}
