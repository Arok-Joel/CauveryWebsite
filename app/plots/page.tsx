// app/plots/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// This would come from your database
const DUMMY_PLOTS = [
  {
    id: '1',
    title: 'Corner Plot A-123',
    size: '500 sq yards',
    price: 5000000,
    location: 'Block A, Phase 1',
    status: 'available'
  },
  {
    id: '2',
    title: 'Commercial Plot B-456',
    size: '1000 sq yards',
    price: 10000000,
    location: 'Block B, Phase 2',
    status: 'available'
  }
]

export default function PlotsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Available Plots</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DUMMY_PLOTS.map((plot) => (
          <Card key={plot.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plot.title}</CardTitle>
              <CardDescription>{plot.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-semibold">Size:</span> {plot.size}</p>
                <p><span className="font-semibold">Price:</span> Rs. {plot.price.toLocaleString()}</p>
                <p><span className="font-semibold">Status:</span> 
                  <span className="capitalize ml-1 text-green-600">{plot.status}</span>
                </p>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full">View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}