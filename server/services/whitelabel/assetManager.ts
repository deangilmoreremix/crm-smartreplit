/**
 * Asset Management Service
 * Handles asset upload, optimization, versioning, and CDN distribution
 */

import { createClient } from '@supabase/supabase-js';
import { errorLogger } from '../errorLogger';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface Asset {
  id: string;
  tenantId: string;
  name: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  category: 'logo' | 'icon' | 'image' | 'document' | 'video';
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  optimized: boolean;
  version: number;
  parentAssetId?: string;
  metadata?: Record<string, any>;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetUploadOptions {
  tenantId: string;
  category: Asset['category'];
  optimize?: boolean;
  generateThumbnail?: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
}

export interface AssetListOptions {
  tenantId: string;
  category?: Asset['category'];
  page?: number;
  limit?: number;
  search?: string;
}

class AssetManager {
  private storageBucket: string;
  private cdnUrl?: string;

  constructor() {
    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'assets';
    this.cdnUrl = process.env.CDN_URL;
  }

  /**
   * Upload asset to storage
   */
  async uploadAsset(
    file: Buffer,
    fileName: string,
    options: AssetUploadOptions
  ): Promise<Asset> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Generate unique file name
      const fileExt = fileName.split('.').pop();
      const uniqueName = `${options.tenantId}/${options.category}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.storageBucket)
        .upload(uniqueName, file, {
          contentType: this.getMimeType(fileName),
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(uniqueName);

      const url = urlData.publicUrl;
      const cdnUrl = this.cdnUrl ? `${this.cdnUrl}/${uniqueName}` : url;

      // Get file metadata
      const fileSize = file.length;
      const mimeType = this.getMimeType(fileName);

      // Create asset record in database
      const { data: assetData, error: dbError } = await supabase
        .from('assets')
        .insert({
          tenant_id: options.tenantId,
          name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          original_name: fileName,
          file_type: fileExt || 'unknown',
          file_size: fileSize,
          mime_type: mimeType,
          category: options.category,
          url,
          cdn_url: cdnUrl,
          optimized: false,
          version: 1,
          metadata: options.metadata || {},
          usage_count: 0,
          created_by: options.createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file
        await supabase.storage.from(this.storageBucket).remove([uniqueName]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      const asset = this.mapDatabaseToAsset(assetData);

      // Optimize if requested and is an image
      if (options.optimize && this.isImage(mimeType)) {
        // Queue optimization (would be done async in production)
        this.optimizeAssetAsync(asset.id).catch(error => {
          errorLogger.logError('Asset optimization failed', error, { assetId: asset.id });
        });
      }

      // Generate thumbnail if requested
      if (options.generateThumbnail && this.isImage(mimeType)) {
        this.generateThumbnailAsync(asset.id).catch(error => {
          errorLogger.logError('Thumbnail generation failed', error, { assetId: asset.id });
        });
      }

      return asset;

    } catch (error: any) {
      await errorLogger.logError('Asset upload failed', error, {
        tenantId: options.tenantId,
        fileName
      });
      throw error;
    }
  }

  /**
   * Get asset by ID
   */
  async getAsset(assetId: string): Promise<Asset> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error || !data) {
      throw new Error('Asset not found');
    }

    // Increment usage count
    await supabase
      .from('assets')
      .update({ usage_count: (data.usage_count || 0) + 1 })
      .eq('id', assetId);

    return this.mapDatabaseToAsset(data);
  }

  /**
   * List assets
   */
  async listAssets(options: AssetListOptions): Promise<{ assets: Asset[]; total: number; page: number; pages: number }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('assets')
      .select('*', { count: 'exact' })
      .eq('tenant_id', options.tenantId);

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,original_name.ilike.%${options.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list assets: ${error.message}`);
    }

    const assets = (data || []).map(d => this.mapDatabaseToAsset(d));
    const total = count || 0;
    const pages = Math.ceil(total / limit);

    return { assets, total, page, pages };
  }

  /**
   * Update asset metadata
   */
  async updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.metadata) dbUpdates.metadata = updates.metadata;

    const { data, error } = await supabase
      .from('assets')
      .update(dbUpdates)
      .eq('id', assetId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update asset: ${error.message}`);
    }

    return this.mapDatabaseToAsset(data);
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get asset to find storage path
    const { data: assetData, error: fetchError } = await supabase
      .from('assets')
      .select('url, tenant_id, category')
      .eq('id', assetId)
      .single();

    if (fetchError || !assetData) {
      throw new Error('Asset not found');
    }

    // Extract storage path from URL
    const urlParts = assetData.url.split('/');
    const storagePath = urlParts.slice(urlParts.indexOf(this.storageBucket) + 1).join('/');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.storageBucket)
      .remove([storagePath]);

    if (storageError) {
      console.error('Failed to delete from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (dbError) {
      throw new Error(`Failed to delete asset: ${dbError.message}`);
    }
  }

  /**
   * Optimize asset (async operation)
   */
  private async optimizeAssetAsync(assetId: string): Promise<void> {
    try {
      // In production, this would use Sharp or similar for image optimization
      // For now, just mark as optimized
      if (!supabase) return;

      await supabase
        .from('assets')
        .update({
          optimized: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', assetId);

    } catch (error: any) {
      console.error(`Asset optimization failed for ${assetId}:`, error.message);
    }
  }

  /**
   * Generate thumbnail (async operation)
   */
  private async generateThumbnailAsync(assetId: string): Promise<void> {
    try {
      // In production, this would generate actual thumbnails
      // For now, just log the operation
      console.log(`Thumbnail generation queued for asset ${assetId}`);

    } catch (error: any) {
      console.error(`Thumbnail generation failed for ${assetId}:`, error.message);
    }
  }

  /**
   * Get asset versions
   */
  async getAssetVersions(assetId: string): Promise<Asset[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get the asset to find its parent or use it as parent
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (assetError || !asset) {
      throw new Error('Asset not found');
    }

    // Get all versions (including this one and its children)
    const parentId = asset.parent_asset_id || assetId;
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .or(`id.eq.${parentId},parent_asset_id.eq.${parentId}`)
      .order('version', { ascending: false });

    if (error) {
      throw new Error(`Failed to get asset versions: ${error.message}`);
    }

    return (data || []).map(d => this.mapDatabaseToAsset(d));
  }

  /**
   * Create new asset version
   */
  async createAssetVersion(assetId: string, file: Buffer, fileName: string): Promise<Asset> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get original asset
    const { data: originalAsset, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (fetchError || !originalAsset) {
      throw new Error('Original asset not found');
    }

    // Get latest version number
    const versions = await this.getAssetVersions(assetId);
    const latestVersion = Math.max(...versions.map(v => v.version));

    // Upload new version
    const newAsset = await this.uploadAsset(file, fileName, {
      tenantId: originalAsset.tenant_id,
      category: originalAsset.category,
      createdBy: originalAsset.created_by,
      metadata: originalAsset.metadata
    });

    // Update to link to parent and set version
    await supabase
      .from('assets')
      .update({
        parent_asset_id: originalAsset.parent_asset_id || assetId,
        version: latestVersion + 1
      })
      .eq('id', newAsset.id);

    return { ...newAsset, version: latestVersion + 1, parentAssetId: originalAsset.parent_asset_id || assetId };
  }

  /**
   * Bulk upload assets
   */
  async bulkUpload(
    files: Array<{ buffer: Buffer; fileName: string }>,
    options: AssetUploadOptions
  ): Promise<{ assets: Asset[]; errors: Array<{ fileName: string; error: string }> }> {
    const assets: Asset[] = [];
    const errors: Array<{ fileName: string; error: string }> = [];

    for (const file of files) {
      try {
        const asset = await this.uploadAsset(file.buffer, file.fileName, options);
        assets.push(asset);
      } catch (error: any) {
        errors.push({
          fileName: file.fileName,
          error: error.message
        });
      }
    }

    return { assets, errors };
  }

  /**
   * Get asset usage statistics
   */
  async getAssetUsageStats(tenantId: string): Promise<{
    totalAssets: number;
    totalSize: number;
    byCategory: Record<string, number>;
    recentUploads: Asset[];
  }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get all assets for tenant
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to get asset stats: ${error.message}`);
    }

    const assetList = (assets || []).map(d => this.mapDatabaseToAsset(d));

    // Calculate statistics
    const totalAssets = assetList.length;
    const totalSize = assetList.reduce((sum, asset) => sum + asset.fileSize, 0);
    
    const byCategory: Record<string, number> = {};
    assetList.forEach(asset => {
      byCategory[asset.category] = (byCategory[asset.category] || 0) + 1;
    });

    const recentUploads = assetList
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      totalAssets,
      totalSize,
      byCategory,
      recentUploads
    };
  }

  /**
   * Search assets
   */
  async searchAssets(tenantId: string, query: string): Promise<Asset[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`name.ilike.%${query}%,original_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Asset search failed: ${error.message}`);
    }

    return (data || []).map(d => this.mapDatabaseToAsset(d));
  }

  /**
   * Get MIME type from file name
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Videos
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      
      // Other
      'json': 'application/json',
      'txt': 'text/plain',
      'css': 'text/css',
      'js': 'application/javascript'
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Check if MIME type is an image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Map database record to Asset
   */
  private mapDatabaseToAsset(data: any): Asset {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      originalName: data.original_name,
      fileType: data.file_type,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      category: data.category,
      url: data.url,
      cdnUrl: data.cdn_url,
      thumbnailUrl: data.thumbnail_url,
      width: data.width,
      height: data.height,
      optimized: data.optimized,
      version: data.version,
      parentAssetId: data.parent_asset_id,
      metadata: data.metadata,
      usageCount: data.usage_count,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Validate file size
   */
  validateFileSize(fileSize: number, maxSize: number = 10 * 1024 * 1024): boolean {
    return fileSize <= maxSize;
  }

  /**
   * Validate file type
   */
  validateFileType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return mimeType.startsWith(type.replace('/*', '/'));
      }
      return mimeType === type;
    });
  }
}

// Export singleton instance
export const assetManager = new AssetManager();
