import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BlobStorageManager from '@/components/admin/BlobStorageManager';

export const metadata: Metadata = {
  title: 'Image Management | Royal Cauvery Farms Admin',
  description: 'Manage images in Vercel Blob Storage',
};

export default function ImagesManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Vercel Blob Storage</CardTitle>
          <CardDescription>
            Upload and manage images for the home page using Vercel Blob Storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlobStorageManager />
        </CardContent>
      </Card>
    </div>
  );
} 