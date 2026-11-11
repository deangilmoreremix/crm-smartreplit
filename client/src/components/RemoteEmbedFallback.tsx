import React from 'react';

interface RemoteEmbedFallbackProps {
  title: string;
  url: string;
  onRetry: () => void;
  message?: string;
}

/** Shown when an embedded remote app never loads: Retry + Open in new tab. */
const RemoteEmbedFallback: React.FC<RemoteEmbedFallbackProps> = ({ title, url, onRetry, message }) => (
  <div
    role="alert"
    data-testid="remote-embed-fallback"
    className="w-full h-full min-h-[240px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6"
  >
    <div className="max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
      <p className="text-gray-900 dark:text-white font-semibold">{title} unavailable</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {message ?? 'The module did not respond in time. It may be offline or blocked by your network.'}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Retry
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Open in new tab
        </a>
      </div>
    </div>
  </div>
);

export default RemoteEmbedFallback;
