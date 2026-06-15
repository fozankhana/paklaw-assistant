import { Link } from 'react-router-dom';
import Badge from '../common/Badge';

const ICONS = {
  constitution: '📜',
  act: '📘',
};

export default function LawCard({ doc }) {
  return (
    <Link
      to={`/library/${doc.slug}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl">{ICONS[doc.type] || '📄'}</span>
        <Badge color={doc.type === 'constitution' ? 'green' : 'blue'}>
          {doc.type === 'constitution' ? 'Constitution' : 'Act'}
        </Badge>
      </div>
      <h3 className="mt-3 font-semibold text-gray-900 group-hover:text-primary-700">
        {doc.document}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{doc.description}</p>
      <p className="mt-3 text-xs font-medium text-gray-400">
        {doc.entryCount} provisions{doc.year ? ` · ${doc.year}` : ''}
      </p>
    </Link>
  );
}
