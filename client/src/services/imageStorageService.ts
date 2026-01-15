import { supabase } from '../lib/supabase';

export interface StoredImage {
  id: string;
  userId: string;
  filename: string;
  storagePath: string;
  publicUrl: string;
  promptText: string;
  feature: string;
  format: string;
  aspectRatio: string;
  createdAt: Date;
  metadata?: any;
}

export class ImageStorageService {
  private bucket = 'generated-images';

  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(
    imageData: string,
    filename: string,
    userId: string,
    metadata?: {
      promptText?: string;
      feature?: string;
      format?: string;
      aspectRatio?: string;
    }
  ): Promise<StoredImage> {
    try {
      // Convert base64 data URL to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Create unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = filename.split('.').pop() || 'png';
      const uniqueFilename = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

      // Create user-specific path
      const filePath = `${userId}/${uniqueFilename}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      // Create database record
      const imageRecord: StoredImage = {
        id: crypto.randomUUID(),
        userId,
        filename: uniqueFilename,
        storagePath: filePath,
        publicUrl,
        promptText: metadata?.promptText || '',
        feature: metadata?.feature || '',
        format: metadata?.format || '',
        aspectRatio: metadata?.aspectRatio || '',
        createdAt: new Date(),
        metadata
      };

      // Save metadata to database (if you want to track images in a table)
      // This is optional - you could also just rely on storage listing
      await this.saveImageMetadata(imageRecord);

      return imageRecord;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images at once
   */
  async uploadImages(
    imageDataArray: string[],
    baseFilename: string,
    userId: string,
    metadata?: any
  ): Promise<StoredImage[]> {
    const uploadPromises = imageDataArray.map((imageData, index) => {
      const filename = `${baseFilename}-${index + 1}.png`;
      return this.uploadImage(imageData, filename, userId, metadata);
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Get all images for a user
   */
  async getUserImages(userId: string): Promise<StoredImage[]> {
    try {
      // List files in user's directory
      const { data: files, error } = await supabase.storage
        .from(this.bucket)
        .list(userId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Failed to list images: ${error.message}`);
      }

      // Convert to StoredImage format
      const images: StoredImage[] = files.map(file => ({
        id: file.id || crypto.randomUUID(),
        userId,
        filename: file.name,
        storagePath: `${userId}/${file.name}`,
        publicUrl: supabase.storage.from(this.bucket).getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
        promptText: '',
        feature: '',
        format: '',
        aspectRatio: '',
        createdAt: new Date(file.created_at),
        metadata: file.metadata
      }));

      return images;
    } catch (error) {
      console.error('Failed to get user images:', error);
      return [];
    }
  }

  /**
   * Delete an image
   */
  async deleteImage(storagePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([storagePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      // Also delete from database if you have metadata tracking
      await this.deleteImageMetadata(storagePath);
    } catch (error) {
      console.error('Image deletion failed:', error);
      throw error;
    }
  }

  /**
   * Save image metadata to database (optional)
   */
  private async saveImageMetadata(image: StoredImage): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_generated_images')
        .insert({
          id: image.id,
          user_id: image.userId,
          filename: image.filename,
          storage_path: image.storagePath,
          public_url: image.publicUrl,
          prompt_text: image.promptText,
          feature: image.feature,
          format: image.format,
          aspect_ratio: image.aspectRatio,
          metadata: image.metadata,
          created_at: image.createdAt.toISOString()
        });

      if (error) {
        console.warn('Failed to save image metadata:', error);
        // Don't throw - storage succeeded, metadata is optional
      }
    } catch (error) {
      console.warn('Metadata save failed:', error);
    }
  }

  /**
   * Delete image metadata from database (optional)
   */
  private async deleteImageMetadata(storagePath: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_generated_images')
        .delete()
        .eq('storage_path', storagePath);

      if (error) {
        console.warn('Failed to delete image metadata:', error);
      }
    } catch (error) {
      console.warn('Metadata delete failed:', error);
    }
  }

  /**
   * Check if storage is available
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list('', { limit: 1 });

      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const imageStorage = new ImageStorageService();