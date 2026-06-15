import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SearchBar from '../components/library/SearchBar';

const EXAMPLES = [
  'What does Article 25 say about equality?',
  'What is the punishment under Section 489-F for a bounced cheque?',
  'What are the conditions for bail in a non-bailable offence?',
  'What makes an agreement a valid contract?',
  'What is cyber stalking under Pakistani law?',
];

const FEATURES = [
  {
    icon: '🔎',
    title: 'Grounded answers',
    desc: 'Every reply is built from the actual text of the Constitution and Acts — no guesswork.',
  },
  {
    icon: '🔗',
    title: 'Real citations',
    desc: 'See the exact Article or Section behind each answer and open it in one click.',
  },
  {
    icon: '📚',
    title: 'Browsable library',
    desc: 'Read the source law directly, organised by Part, Chapter, Article and Section.',
  },
  {
    icon: '🛡️',
    title: 'Private & offline-capable',
    desc: 'Runs on a local model with no accounts and no data leaving your machine.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-gray-50">
        <div className="container-page py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white px-3 py-1 text-xs font-medium text-primary-700">
            ⚖ Constitution & Legal Acts of Pakistan
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Understand Pakistani law in
            <span className="text-primary-600"> plain language</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Ask a question and get a clear, cited answer drawn straight from the Constitution
            and key statutes — or browse the full law library yourself.
          </p>

          <form onSubmit={onSearch} className="mx-auto mt-8 max-w-xl">
            <SearchBar value={query} onChange={setQuery} placeholder="Search a topic, Article or Section…" />
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/chat"
              className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-primary-700"
            >
              Ask the Assistant
            </Link>
            <Link
              to="/library"
              className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Browse the Library
            </Link>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="container-page -mt-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Try asking
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Link
                key={ex}
                to={`/chat?q=${encodeURIComponent(ex)}`}
                className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-sm text-gray-700 hover:border-primary-300 hover:text-primary-700"
              >
                {ex}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
