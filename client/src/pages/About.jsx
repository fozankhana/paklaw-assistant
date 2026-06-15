import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { systemService } from '../services/api';
import Badge from '../components/common/Badge';

const STEPS = [
  {
    n: 1,
    title: 'Retrieve',
    desc: 'Your question is matched against every Article and Section in the library using a hybrid search that combines keyword (BM25) ranking with exact reference detection.',
  },
  {
    n: 2,
    title: 'Ground',
    desc: 'The most relevant provisions are passed to a local language model with strict instructions to answer only from that source text.',
  },
  {
    n: 3,
    title: 'Cite',
    desc: 'The answer is returned with citations to the exact provisions, which you can open and read in full in the law library.',
  },
];

export default function About() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    systemService
      .health()
      .then(({ data }) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold text-gray-900">About PakLaw Assistant</h1>
      <p className="mt-3 text-lg text-gray-600">
        PakLaw Assistant is a legal research aid that helps you understand the Constitution
        and key statutes of Pakistan. It answers questions in plain language and always shows
        you the source provisions behind every answer.
      </p>

      <h2 className="mt-10 text-xl font-bold text-gray-900">How it works</h2>
      <div className="mt-4 space-y-4">
        {STEPS.map((step) => (
          <div key={step.n} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 font-bold text-white">
              {step.n}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold text-gray-900">What's in the library</h2>
      <p className="mt-2 text-gray-600">
        The knowledge base contains the Constitution of Pakistan 1973 (including the
        Fundamental Rights) and a curated set of core statutes — the Pakistan Penal Code, the
        Code of Criminal Procedure, the Contract Act, and the Prevention of Electronic Crimes
        Act. It is a representative selection of widely-cited provisions, not the complete
        text of every law.
      </p>
      <Link to="/library" className="mt-3 inline-block text-primary-700 hover:underline">
        Browse the full library →
      </Link>

      {health && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-gray-700">System status</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge color="green">{health.chunks} provisions indexed</Badge>
            <Badge color="blue">{health.retrievalMode}</Badge>
            <Badge color={health.ollama ? 'green' : 'amber'}>
              Local model: {health.ollama ? `online (${health.model})` : 'offline — using source-quoting fallback'}
            </Badge>
          </div>
        </div>
      )}

      <div className="mt-10 rounded-xl border border-amber-100 bg-amber-50 p-5">
        <h2 className="font-bold text-amber-900">Legal disclaimer</h2>
        <p className="mt-2 text-sm text-amber-800">
          PakLaw Assistant provides general legal information for educational and research
          purposes only. It is not legal advice and does not create a lawyer–client
          relationship. Laws are amended over time; always verify provisions against the
          official Gazette of Pakistan and consult a qualified lawyer before acting on any
          information here.
        </p>
      </div>
    </div>
  );
}
