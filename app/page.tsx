import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0">
          <Image
            src="/hero-bg.jpg"
            alt="Royal Cauvery Farms"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="container relative z-20 mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-white mb-6">
              Welcome to Royal Cauvery Farms
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Your gateway to premium plots in Sri Sai Nagar. Experience the perfect blend of nature and modern living.
            </p>
            <Button asChild size="lg" className="mr-4">
              <Link href="/plots">Browse Plots</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white/10 text-white hover:bg-white/20">
              <Link href="/contact">Contact Us</Link>
            </Button>
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
                Located in a prime location, Sri Sai Nagar offers meticulously planned plots perfect for building your dream home. Our development features:
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
              <Image
                src="/plot-layout.jpg"
                alt="Sri Sai Nagar Layout"
                fill
                className="object-cover rounded-lg"
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
            Browse through our available plots and take the first step towards owning your piece of Sri Sai Nagar.
          </p>
          <Button asChild size="lg">
            <Link href="/plots">View Available Plots</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
