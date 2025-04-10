import { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BlobImage } from '@/components/BlobImage';
import { BlobUrlChecker } from '@/components/admin/BlobUrlChecker';

export const metadata: Metadata = {
  title: 'Blob Storage Status | Royal Cauvery Farms Admin',
  description: 'Check which images are using Blob Storage',
};

// Images we know should be using blob storage
const homepageImages = [
  { path: '/hero-bg.jpg', name: 'Hero Background' },
  { path: '/plot-layout.jpg', name: 'Plot Layout' },
];

export default function BlobStatusPage() {
  return (
    <AdminShell>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Blob Storage Status</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Homepage Images</CardTitle>
            <CardDescription>
              These images should be using Blob Storage if properly migrated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homepageImages.map(image => (
                <Card key={image.path} className="overflow-hidden">
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-lg">{image.name}</CardTitle>
                    <CardDescription className="truncate text-xs">
                      Path: {image.path}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="relative h-48 w-full overflow-hidden rounded-md border bg-gray-100 mb-3">
                      <BlobImage
                        src={image.path}
                        alt={image.name}
                        fill
                        className="object-cover"
                        showDebug={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Check Any Image</CardTitle>
            <CardDescription>
              Use this form to check any image URL to see if it's using Blob Storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlobUrlChecker />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
} 