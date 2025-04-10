import { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BlobImage } from '@/components/BlobImage';
import { isBlobUrl } from '@/lib/blob-helpers';

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
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Image URL Analysis</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Enter any URL or path to check if it's a Blob Storage URL
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="image-url"
                    placeholder="Enter image URL or path"
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                      const input = document.getElementById('image-url') as HTMLInputElement;
                      const result = document.getElementById('url-result') as HTMLDivElement;
                      
                      if (input.value) {
                        const isBlob = isBlobUrl(input.value);
                        result.innerHTML = isBlob
                          ? `<span class="text-green-600">✓ This is a Blob Storage URL</span>`
                          : `<span class="text-yellow-600">× This is NOT a Blob Storage URL</span>`;
                      }
                    }}
                  >
                    Check
                  </button>
                </div>
                <div id="url-result" className="mt-2 font-medium"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
} 