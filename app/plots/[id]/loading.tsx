import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PlotDetailLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column - Images and Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Hero Section Skeleton */}
          <div className="relative">
            <div className="w-full h-[500px] rounded-xl bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-[#3C5A3E]/20 border-t-[#3C5A3E] rounded-full animate-spin"></div>
            </div>
          </div>
          
          {/* Quick Info Bar Skeleton */}
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-3 divide-x">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 text-center">
                    <div className="h-4 w-20 mx-auto bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 w-16 mx-auto bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Plot Details Skeleton */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center space-x-3">
                        <div className="p-3 bg-gray-200 rounded-lg animate-pulse h-12 w-12"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Right Column Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="fixed bottom-4 right-4 bg-[#3C5A3E] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading plot details...
      </div>
    </div>
  );
} 