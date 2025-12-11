import React, { useState, useEffect } from 'react';
import { imageStorage, type StoredImage } from '../services/imageStorageService';
import { Download, Trash2, Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ImageGalleryProps {
  userId: string;
  onImageSelect?: (image: StoredImage) => void;
  maxImages?: number;
  showActions?: boolean;
}

export default function ImageGallery({
  userId,
  onImageSelect,
  maxImages = 50,
  showActions = true
}: ImageGalleryProps) {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUserImages();
  }, [userId]);

  const loadUserImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const userImages = await imageStorage.getUserImages(userId);
      setImages(userImages.slice(0, maxImages));
    } catch (err) {
      console.error('Failed to load images:', err);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (image: StoredImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await imageStorage.deleteImage(image.storagePath);
      setImages(prev => prev.filter(img => img.id !== image.id));
    } catch (err) {
      console.error('Failed to delete image:', err);
      alert('Failed to delete image');
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDownloadImage = (image: StoredImage) => {
    const link = document.createElement('a');
    link.href = image.publicUrl;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading images...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">⚠️ {error}</div>
        <button
          onClick={loadUserImages}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No images yet</h3>
        <p className="text-gray-500 text-sm">
          Generate some images with the AI Image Generator to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Generated Images ({images.length})
        </h3>
        <button
          onClick={loadUserImages}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="aspect-square overflow-hidden">
              <img
                src={image.publicUrl}
                alt={image.filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onClick={() => onImageSelect?.(image)}
              />
            </div>

            {/* Overlay with actions */}
            {showActions && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                  <button
                    onClick={() => handleDownloadImage(image)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-gray-900 transition-colors"
                    title="Download image"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(image.publicUrl)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-gray-900 transition-colors"
                    title="Copy image URL"
                  >
                    {copiedUrl === image.publicUrl ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <a
                    href={image.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-gray-900 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => handleDeleteImage(image)}
                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    title="Delete image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Image info */}
            <div className="p-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{image.feature || 'General'}</span>
                <span>{image.format || 'N/A'}</span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {new Date(image.createdAt).toLocaleDateString()}
              </p>
              {image.promptText && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {image.promptText.substring(0, 60)}...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {images.length >= maxImages && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing first {maxImages} images.{" "}
            <button className="text-blue-600 hover:text-blue-800">
              View all
            </button>
          </p>
        </div>
      )}
    </div>
  );
}