import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <div className="text-6xl">📜</div>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-500">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700"
      >
        Back to home
      </Link>
    </div>
  );
}
