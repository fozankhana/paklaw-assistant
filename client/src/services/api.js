import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 60000 });

export const chatService = {
  askStream: async (question, history, { onToken, onStatus, onDone, onError }) => {
    let reader;
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Server error (HTTP ${resp.status})`);
      }

      reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'token') onToken(ev.content);
            else if (ev.type === 'status') onStatus(ev.text);
            else if (ev.type === 'done') onDone(ev);
            else if (ev.type === 'error') onError(ev.message);
          } catch {}
        }
      }
    } catch (err) {
      onError(err.message ?? 'Connection error — make sure the server is running.');
    } finally {
      try { reader?.releaseLock(); } catch {}
    }
  },
};

export const lawService = {
  list: () => api.get('/laws'),
  get: (slug) => api.get(`/laws/${slug}`),
  getEntry: (slug, refKey) => api.get(`/laws/${slug}/${refKey}`),
};

export const searchService = {
  query: (q, limit = 20) => api.get('/search', { params: { q, limit } }),
};

export const systemService = {
  health: () => api.get('/health'),
};

export default api;
