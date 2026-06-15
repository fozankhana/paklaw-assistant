import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="container-page py-8 text-sm text-gray-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-700">PakLaw Assistant</p>
            <p className="mt-1 max-w-md">
              A research aid for the Constitution and legal Acts of Pakistan. Answers are
              grounded in the source law and shown with citations.
            </p>
          </div>
          <div className="flex gap-5">
            <Link to="/chat" className="hover:text-primary-700">
              Ask
            </Link>
            <Link to="/library" className="hover:text-primary-700">
              Library
            </Link>
            <Link to="/about" className="hover:text-primary-700">
              About
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          General legal information only — not legal advice. Always verify against the
          official Gazette of Pakistan and consult a qualified lawyer.
        </p>
      </div>
    </footer>
  );
}
