'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { uploadToBlob, isBlobUrl } from '@/lib/blob-helpers';
import { toast } from 'sonner';
import { Upload, Trash2, FileImage, RefreshCw, MoveRight } from 'lucide-react';

interface BlobItem {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

interface ImageItem {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
}

export default function BlobStorageManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<ImageItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [homepageImages, setHomepageImages] = useState<string[]>([
    '/hero-bg.jpg',
    '/plot-layout.jpg'
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBlobs();
  }, []);

  const fetchBlobs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/upload/list');
      if (!response.ok) {
        throw new Error('Failed to fetch blobs');
      }

      const data = await response.json();
      
      // Convert blobs to our format
      const images: ImageItem[] = data.blobs.map((blob: BlobItem) => ({
        id: blob.url,
        url: blob.url,
        name: blob.url.split('/').pop() || 'Unnamed',
        uploadedAt: new Date(blob.uploadedAt),
      }));

      setUploadedImages(images);
    } catch (error) {
      console.error('Error fetching blobs:', error);
      toast.error('Failed to fetch uploaded images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const blobUrl = await uploadToBlob(file, '/');
      if (!blobUrl) {
        throw new Error('Failed to upload image');
      }

      const newImage: ImageItem = {
        id: Date.now().toString(),
        url: blobUrl,
        name: file.name,
        uploadedAt: new Date(),
      };

      setUploadedImages((prev) => [newImage, ...prev]);
      setPreviewImage(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };
  
  const handleDeleteBlob = async (url: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(url);
    try {
      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      setUploadedImages((prev) => prev.filter(image => image.url !== url));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsDeleting(null);
    }
  };

  const migrateHomepageImages = async () => {
    if (!confirm('This will upload all homepage images to Blob storage. Continue?')) {
      return;
    }
    
    setIsMigrating(true);
    const results: { success: boolean; path: string; url?: string }[] = [];
    
    try {
      for (const imagePath of homepageImages) {
        try {
          // Skip if already a blob URL
          if (isBlobUrl(imagePath)) {
            results.push({ success: true, path: imagePath, url: imagePath });
            continue;
          }
          
          // Fetch the image
          const response = await fetch(imagePath);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${imagePath}`);
          }
          
          // Convert to file
          const blob = await response.blob();
          const file = new File([blob], imagePath.split('/').pop() || 'image.jpg', { type: blob.type });
          
          // Upload to blob storage
          const blobUrl = await uploadToBlob(file, '/');
          if (!blobUrl) {
            throw new Error('Failed to upload to Blob storage');
          }
          
          results.push({ success: true, path: imagePath, url: blobUrl });
          
          // Add to our list of uploaded images
          const newImage: ImageItem = {
            id: Date.now().toString(),
            url: blobUrl,
            name: file.name,
            uploadedAt: new Date(),
          };
          
          setUploadedImages((prev) => [newImage, ...prev]);
        } catch (error) {
          console.error(`Error migrating ${imagePath}:`, error);
          results.push({ success: false, path: imagePath });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      if (successCount === homepageImages.length) {
        toast.success(`Successfully migrated all ${successCount} images`);
      } else {
        toast.warning(`Migrated ${successCount} of ${homepageImages.length} images`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Failed to complete migration');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload new image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          
          {previewImage && (
            <div className="mt-4 relative aspect-video rounded-md overflow-hidden bg-gray-100">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={isUploading || !previewImage}
            className="w-full"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload to Blob Storage
              </span>
            )}
          </Button>
          
          <div className="text-sm text-gray-500 mt-2">
            <p>
              Only images for the homepage will be stored in Vercel Blob storage.
              The URL will be in format: <code>*.public.blob.vercel-storage.com</code>
            </p>
          </div>
          
          {/* Migration section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-md font-medium mb-2">Migrate Homepage Images</h3>
            <div className="text-sm text-gray-500 mb-3">
              This will upload the standard homepage images to Blob storage.
            </div>
            <Button
              variant="outline"
              onClick={migrateHomepageImages}
              disabled={isMigrating}
              className="w-full"
            >
              {isMigrating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  Migrating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <MoveRight className="h-4 w-4" />
                  Migrate Homepage Images
                </span>
              )}
            </Button>
            <div className="mt-2 text-xs text-gray-500">
              Images to migrate: {homepageImages.join(', ')}
            </div>
          </div>
        </div>
        
        {/* Recently uploaded images */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Uploaded Images</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBlobs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
              <div className="text-center text-gray-500">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
                <p>Loading images...</p>
              </div>
            </div>
          ) : uploadedImages.length === 0 ? (
            <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
              <div className="text-center text-gray-500">
                <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No images uploaded yet</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {uploadedImages.map((image) => (
                <Card key={image.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded bg-gray-100 overflow-hidden">
                      <img 
                        src={image.url} 
                        alt={image.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium truncate" title={image.name}>
                        {image.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {image.uploadedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyUrl(image.url)}
                    >
                      Copy URL
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={isDeleting === image.url}
                      onClick={() => handleDeleteBlob(image.url)}
                    >
                      {isDeleting === image.url ? (
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 