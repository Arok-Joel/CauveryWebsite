import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BlobImage } from '@/components/BlobImage';
import HomeCarousel from '@/components/HomeCarousel';
import { EventsSection } from '@/components/EventsSection';
import { fetchCarouselImages, CarouselImage } from '@/lib/carousel-helpers';

// Add revalidation configuration for this page
export const revalidate = 60; // Revalidate at most every 60 seconds

export default async function Home() {
  // Fetch carousel images
  const carouselImages = await fetchCarouselImages();
  
  // Ensure main.png is included as the first image
  const hasMainImage = carouselImages.some((img: CarouselImage) => img.url === '/main.png');
  
  if (!hasMainImage) {
    carouselImages.unshift({
      url: '/main.png',
      alt: 'Royal Cauvery Farms'
    });
  }
  
  return (
    <main className="min-h-screen w-full p-0 m-0 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] w-full flex items-center">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0">
          <BlobImage
            src="/hero-bg.jpg"
            alt="Royal Cauvery Farms"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            quality={100}
            useBlobStorage={true}
          />
        </div>
        <div className="container relative z-20 mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-6xl font-bold text-white mb-6 text-shadow-lg">Welcome to Royal Cauvery Farms</h1>
            <p className="text-2xl text-white mb-8 text-shadow-md">
              Your gateway to premium plots in Sri Sai Nagar. Experience the perfect blend of nature
              and modern living.
            </p>
            <Button asChild size="lg" className="mr-4 text-lg px-6 py-3">
              <Link href="/plots">Browse Plots</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/20 text-white hover:bg-white/30 text-lg px-6 py-3"
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Carousel and Events Section - Side by Side */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Explore Royal Cauvery Farms</h2>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Carousel - Left Side */}
            <div className="lg:w-2/3">
              <HomeCarousel images={carouselImages} />
            </div>
            
            {/* Events - Right Side */}
            <div className="lg:w-1/3">
              <div className="bg-[#3C5A3E] text-white p-6 rounded-lg h-full flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-center">News & Events</h2>
                <div className="flex-grow overflow-hidden">
                  <EventsSection minimal={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">About Sri Sai Nagar</h2>
              <p className="text-gray-600 mb-4">
                Located in a prime location, Sri Sai Nagar offers meticulously planned plots perfect
                for building your dream home. Our development features:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li>✓ Well-developed infrastructure</li>
                <li>✓ Strategic location with excellent connectivity</li>
                <li>✓ Clear titles and legal documentation</li>
                <li>✓ Planned community layout</li>
                <li>✓ Green spaces and parks</li>
              </ul>
            </div>
            <div className="relative h-[400px]">
              <BlobImage
                src="/plot-layout.jpg"
                alt="Sri Sai Nagar Layout"
                fill
                className="object-cover rounded-lg"
                useBlobStorage={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Find Your Perfect Plot?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse through our available plots and take the first step towards owning your piece of
            Sri Sai Nagar.
          </p>
          <Button asChild size="lg">
            <Link href="/plots">View Available Plots</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
