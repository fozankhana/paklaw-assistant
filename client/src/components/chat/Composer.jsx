import { useState } from 'react';
import Button from '../common/Button';

export default function Composer({ onSend, loading }) {
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSend(value);
    setValue('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      submit(e);
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-gray-200 bg-white p-3">
      <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 focus-within:border-primary-400 focus-within:bg-white transition-colors">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask about an Article, a Section, or any legal question…"
          className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        <Button type="submit" loading={loading} disabled={!value.trim()} size="md">
          Send
        </Button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-gray-400">
        Press Enter to send, Shift+Enter for a new line.
      </p>
    </form>
  );
}
