import React from 'react';
import { Star } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';

export interface FavoriteButtonProps {
  objectType: string;
  recordId: string | number;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ objectType, recordId, className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const id = String(recordId);
  const active = isFavorite(objectType, id);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() => void toggleFavorite(objectType, id)}
      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
    >
      <Star className={`w-4 h-4 ${active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`} />
    </button>
  );
};

export default FavoriteButton;
