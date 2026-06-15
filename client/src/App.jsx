import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DisclaimerBanner from './components/layout/DisclaimerBanner';

import Home from './pages/Home';
import Chat from './pages/Chat';
import Library from './pages/Library';
import DocumentView from './pages/DocumentView';
import ArticleView from './pages/ArticleView';
import SearchResults from './pages/SearchResults';
import About from './pages/About';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <DisclaimerBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:slug" element={<DocumentView />} />
          <Route path="/library/:slug/:refKey" element={<ArticleView />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
