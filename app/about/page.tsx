import { MapPin, Leaf, Home, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] py-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            About Us
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Royal Cauvery Farms</h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Welcome to Royal Cauvery Farms, a premium residential plot development located in the
            heart of Kalladai, offering the perfect blend of modern living and natural serenity.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-[#3C5A3E]/10 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-[#3C5A3E]" />
              </div>
              <CardTitle className="mb-2">Prime Location</CardTitle>
              <p className="text-gray-600">
                Strategically located near Kalladai Panchayat Road with excellent connectivity to
                Trichy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-[#3C5A3E]/10 rounded-full flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6 text-[#3C5A3E]" />
              </div>
              <CardTitle className="mb-2">Green Living</CardTitle>
              <p className="text-gray-600">
                Thoughtfully planned with green spaces and tree-lined streets for a sustainable
                living environment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-[#3C5A3E]/10 rounded-full flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-[#3C5A3E]" />
              </div>
              <CardTitle className="mb-2">Modern Infrastructure</CardTitle>
              <p className="text-gray-600">
                Well-developed infrastructure with proper roads, drainage, and essential amenities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Journey Timeline */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Our Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 bg-[#3C5A3E]/10 rounded relative">
                  <div className="absolute w-2 h-2 bg-[#3C5A3E] rounded-full top-0" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Project Launch</h3>
                  <p className="text-gray-600">
                    Sri Sai Nagar was conceptualized with a vision to create a modern residential
                    community.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 bg-[#3C5A3E]/10 rounded relative">
                  <div className="absolute w-2 h-2 bg-[#3C5A3E] rounded-full top-0" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Infrastructure Development</h3>
                  <p className="text-gray-600">
                    Development of roads, drainage systems, and essential infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 bg-[#3C5A3E]/10 rounded relative">
                  <div className="absolute w-2 h-2 bg-[#3C5A3E] rounded-full top-0" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Growing Community</h3>
                  <p className="text-gray-600">
                    Welcoming new families and building a thriving community.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Choose Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Why Choose Sri Sai Nagar?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#3C5A3E]" />
                <span className="text-gray-600">Clear and marketable titles</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#3C5A3E]" />
                <span className="text-gray-600">DTCP approved layouts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#3C5A3E]" />
                <span className="text-gray-600">Excellent road connectivity</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#3C5A3E]" />
                <span className="text-gray-600">Close proximity to educational institutions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#3C5A3E]" />
                <span className="text-gray-600">Rapidly developing area</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
