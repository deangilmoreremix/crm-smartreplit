import React from 'react';
import type { UrlSource } from '../../services/aiGenerate';

/** Web pages an AI research result cited (from OpenAI web search). Renders nothing when empty. */
export const SourcesList: React.FC<{ sources?: UrlSource[]; className?: string }> = ({ sources, className = '' }) => {
  if (!sources?.length) return null;
  return (
    <div className={`mt-3 text-xs ${className}`}>
      <p className="font-medium text-gray-500 mb-1">Sources</p>
      <ul className="space-y-0.5">
        {sources.map((source) => (
          <li key={source.url} className="truncate">
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {source.title || source.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SourcesList;
