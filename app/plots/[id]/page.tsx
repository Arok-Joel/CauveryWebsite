import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Phone, Mail, MapPin, Ruler, IndianRupee, Compass, Calendar, Clock, Share2, Download, Check, X } from "lucide-react";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface PlotImage {
  url: string;
  caption?: string;
}

// Define a type that extends the base Plot type with the images field
interface PlotWithImages {
  id: string;
  plotNumber: string;
  size: string;
  plotAddress: string;
  price: Decimal;
  dimensions: string;
  facing: string;
  status: string;
  coordinates: any;
  images: string;
  createdAt: Date;
  updatedAt: Date;
  layoutId: string | null;
}

async function getPlot(id: string) {
  const plot = await prisma.plot.findUnique({
    where: { id },
  });

  if (!plot) {
    notFound();
  }

  // Use type assertion to add the images field
  return plot as unknown as PlotWithImages;
}

async function getUserRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  if (!token) {
    return null;
  }

  try {
    const verified = await verifyAuth(token);
    return verified?.role || null;
  } catch (error) {
    return null;
  }
}

export default async function PlotPage({ params }: PageProps) {
  const resolvedParams = await params;
  const plot = await getPlot(resolvedParams.id);
  const userRole = await getUserRole();
  
  // Parse images string with error handling and default empty array
  let images: PlotImage[] = [];
  try {
    if (plot.images && typeof plot.images === 'string' && plot.images.trim() !== '') {
      const imagesData = plot.images.trim();
      if (imagesData === '[]') {
        images = [];
      } else {
        try {
          // First, try parsing the string directly
          let parsedImages = JSON.parse(imagesData);
          
          // If the parsed result is a string (double-encoded JSON), parse it again
          if (typeof parsedImages === 'string') {
            parsedImages = JSON.parse(parsedImages);
          }
          
          // Ensure we have an array
          if (Array.isArray(parsedImages)) {
            images = parsedImages.map(img => ({
              url: typeof img.url === 'string' ? img.url : '',
              caption: typeof img.caption === 'string' ? img.caption : undefined
            })).filter(img => img.url);
          } else {
            console.error('Parsed images is not an array:', parsedImages);
            images = [];
          }
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          console.error('Raw images string:', imagesData);
          images = [];
        }
      }
    }
  } catch (error) {
    console.error('Error handling plot images:', error);
    console.error('Raw images value:', plot.images);
    images = [];
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column - Images and Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Hero Section */}
          <div className="relative">
            {images.length > 0 ? (
              <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
                <Image
                  src={images[0].url}
                  alt={images[0].caption || `Plot ${plot.plotNumber} main view`}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <div className="flex justify-between items-end">
                    <div>
                      <h1 className="text-5xl font-bold mb-3 text-white">Plot {plot.plotNumber}</h1>
                      <p className="text-xl text-white/90 flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        {plot.plotAddress}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="secondary" size="icon">
                        <Share2 className="h-5 w-5" />
                      </Button>
                      <Button variant="secondary" size="icon">
                        <Download className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-[500px] rounded-xl bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No images available</p>
              </div>
            )}
          </div>

          {/* Quick Info Bar */}
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-3 divide-x">
                <div className="px-4 text-center">
                  <p className="text-sm text-muted-foreground">Plot Size</p>
                  <p className="text-xl font-semibold">{plot.size}</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-xl font-semibold">₹{plot.price.toLocaleString()}</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`text-xl font-semibold ${
                    plot.status.toLowerCase() === 'available' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plot Details */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Plot Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Ruler className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plot Size</p>
                      <p className="font-semibold">{plot.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-semibold">{plot.dimensions}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Compass className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Facing</p>
                      <p className="font-semibold">{plot.facing}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>BMRDA Approved Layout</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Clear Legal Title</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Underground Electricity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>24/7 Security</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Well-Planned Roads</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Gallery */}
          {images.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Plot Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {images.slice(1).map((image, index) => (
                    <div key={index} className="group relative">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                        <Image
                          src={image.url}
                          alt={image.caption || `Plot image ${index + 2}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      {image.caption && (
                        <p className="mt-2 text-sm text-muted-foreground">{image.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Contact Information */}
        <div>
          <Card className="sticky top-8">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <div className={`inline-flex items-center justify-center w-full px-4 py-3 rounded-lg ${
                  plot.status.toLowerCase() === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <span className="text-lg font-semibold flex items-center gap-2">
                    {plot.status.toLowerCase() === 'available' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                    Status: {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {userRole === "EMPLOYEE" && plot.status.toLowerCase() === 'available' && (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" asChild>
                    <Link href={`/plots/${plot.id}/book`}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Plot
                    </Link>
                  </Button>
                )}
                <Button className="w-full" size="lg">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Sales Team
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  <Mail className="mr-2 h-4 w-4" />
                  Request Details
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Sales Office</h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <span>
                      Royal Cauvery Farms<br />
                      117, 5th Street<br />
                      Indian Bank Colony<br />
                      K K Nagar<br />
                      Tiruchirappalli - 620021<br />
                      Tamil Nadu, India
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Monday - Saturday, 9:00 AM - 6:00 PM</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 