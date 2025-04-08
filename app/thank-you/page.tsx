'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { generatePDF } from "@/lib/pdf-generator";
import { CheckCircle2, Download, Home, Receipt, Calendar, Phone, Mail, Ruler, IndianRupee } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

// Loading placeholder component
function LoadingThankYou() {
  return (
    <div className="h-[calc(100vh-64px)] bg-gradient-to-b from-green-50 to-white flex items-center">
      <div className="container max-w-4xl mx-auto px-4">
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="bg-[#3C5A3E] text-white px-6 py-8 text-center relative">
            <div className="absolute inset-0 bg-[url('/texture.png')] opacity-10" />
            <div className="relative">
              <div className="mx-auto w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3">
                <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Loading...</h1>
              <p className="text-green-50">
                Please wait while we prepare your booking details
              </p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main component wrapped with params
function ThankYouContent() {
  const searchParams = useSearchParams();
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    // Get booking details from URL parameters
    const details = {
      plotNumber: searchParams.get('plotNumber'),
      customerName: searchParams.get('customerName'),
      price: searchParams.get('price'),
      size: searchParams.get('size'),
      date: new Date().toLocaleDateString(),
      phoneNumber: searchParams.get('phoneNumber'),
      email: searchParams.get('email'),
      employeeId: searchParams.get('employeeId'),
      employeeName: searchParams.get('employeeName'),
      employeeRole: searchParams.get('employeeRole'),
    };
    
    // Debug logging
    console.log('Employee details in URL:', {
      id: searchParams.get('employeeId'),
      name: searchParams.get('employeeName'),
      role: searchParams.get('employeeRole')
    });
    
    console.log('Full booking details:', details);
    setBookingDetails(details);
  }, [searchParams]);

  const handleGeneratePDF = async () => {
    if (bookingDetails) {
      await generatePDF(bookingDetails);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gradient-to-b from-green-50 to-white flex items-center">
      <div className="container max-w-4xl mx-auto px-4">
        <Card className="shadow-xl border-0 overflow-hidden">
          {/* Success Banner */}
          <div className="bg-[#3C5A3E] text-white px-6 py-8 text-center relative">
            <div className="absolute inset-0 bg-[url('/texture.png')] opacity-10" />
            <div className="relative">
              <div className="mx-auto w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-[#3C5A3E]" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Booking Confirmed!</h1>
              <p className="text-green-50">
                Thank you for choosing Royal Cauvery Farms
              </p>
            </div>
          </div>

          <CardContent className="p-6">
            {bookingDetails && (
              <div className="space-y-6">
                {/* Plot Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Receipt className="mr-2 h-5 w-5 text-[#3C5A3E]" />
                    Booking Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Plot Number</p>
                        <p className="text-base font-semibold text-gray-900">#{bookingDetails.plotNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Size</p>
                        <p className="text-base font-semibold text-gray-900 flex items-center">
                          <Ruler className="h-4 w-4 mr-1 text-gray-400" />
                          {bookingDetails.size} Sq.ft
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Price</p>
                        <p className="text-base font-semibold text-gray-900 flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
                          {bookingDetails.price}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Booking Date</p>
                        <p className="text-base font-semibold text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {bookingDetails.date}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <p className="text-base font-semibold text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {bookingDetails.phoneNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-base font-semibold text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-gray-400" />
                          {bookingDetails.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee Information - Only show if employee details exist */}
                {bookingDetails.employeeId && bookingDetails.employeeName && (
                  <>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="mr-2 text-[#3C5A3E]"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Sales Representative
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Employee ID</p>
                            <p className="text-base font-semibold text-gray-900">{bookingDetails.employeeId}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Name</p>
                            <p className="text-base font-semibold text-gray-900">{bookingDetails.employeeName}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Role</p>
                            <p className="text-base font-semibold text-gray-900">{bookingDetails.employeeRole}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Next Steps */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Next Steps</h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>1. Download your booking confirmation below</p>
                    <p>2. Our team will contact you within 24 hours</p>
                    <p>3. Complete the payment process as guided</p>
                    <p>4. Schedule a site visit at your convenience</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <Button 
                    onClick={handleGeneratePDF}
                    className="bg-[#3C5A3E] hover:bg-[#2A3F2B] text-white flex-1 sm:flex-none sm:min-w-[200px]"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Confirmation
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none sm:min-w-[200px]"
                    size="lg"
                    asChild
                  >
                    <Link href="/">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Export the page wrapped in Suspense
export default function ThankYouPage() {
  return (
    <Suspense fallback={<LoadingThankYou />}>
      <ThankYouContent />
    </Suspense>
  );
} 