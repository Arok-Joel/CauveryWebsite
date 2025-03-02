"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Plot {
  id: string;
  plotNumber: string;
  size: string;
  plotAddress: string;
  price: number;
  dimensions: string;
  facing: string;
  status: string;
  coordinates: any;
  images: string;
  createdAt: Date;
  updatedAt: Date;
  layoutId: string | null;
}

interface Employee {
  id: string;
  name: string;
}

const bookingFormSchema = z.object({
  // Plot Details
  plotNumber: z.string(),
  size: z.string(),
  plotAddress: z.string(),
  price: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Price must be a positive number"
  ),
  dimensions: z.string(),
  facing: z.string(),
  
  // Employee Details
  employeeName: z.string(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function BookPlotPage() {
  const params = useParams();
  const router = useRouter();
  const [plot, setPlot] = useState<Plot | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      plotNumber: "",
      size: "",
      plotAddress: "",
      price: "",
      dimensions: "",
      facing: "",
      employeeName: "",
    },
  });

  useEffect(() => {
    // Fetch plot details
    const fetchPlot = async () => {
      try {
        const response = await fetch(`/api/plots/${params.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch plot");
        }
        
        // Check if plot is available
        if (data.status.toLowerCase() !== 'available') {
          toast.error("This plot is not available for booking");
          router.push("/plots");
          return;
        }
        
        setPlot(data);
        
        // Update form with plot details
        form.setValue("plotNumber", data.plotNumber);
        form.setValue("size", data.size);
        form.setValue("plotAddress", data.plotAddress);
        form.setValue("price", data.price.toString());
        form.setValue("dimensions", data.dimensions);
        form.setValue("facing", data.facing);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error fetching plot details");
        router.push("/plots");
      }
    };

    // Fetch employee details
    const fetchEmployee = async () => {
      try {
        const response = await fetch("/api/employee/profile");
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch employee details");
        }
        
        setEmployee(data);
        
        // Update form with employee name only
        form.setValue("employeeName", data.user.name);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error fetching employee details");
        router.push("/plots");
      }
    };

    fetchPlot();
    fetchEmployee();
  }, [params.id, form, router]);

  const generateCustomerLink = (data: BookingFormValues) => {
    try {
      // Create a base64 encoded string of the form data
      const formData = {
        plotId: params.id,
        ...data,
      };
      const encodedData = btoa(JSON.stringify(formData));
      
      // Generate the full URL
      const baseUrl = window.location.origin;
      const customerLink = `${baseUrl}/plots/${params.id}/customer-booking?data=${encodedData}`;
      
      // Set the generated link
      setGeneratedLink(customerLink);
      
      // Copy to clipboard
      navigator.clipboard.writeText(customerLink);
      toast.success("Link generated and copied to clipboard!");
    } catch (error) {
      toast.error("Failed to generate customer link");
    }
  };

  if (!plot || !employee) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              <Skeleton className="h-8 w-64" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Plot Details Loading Skeleton */}
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee Name Loading Skeleton */}
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full md:w-1/2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Generate Customer Link for Plot {plot.plotNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(generateCustomerLink)} className="space-y-8">
              {/* Plot Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Plot Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plotNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plot Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plotAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facing</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Employee Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Employee Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Generated Link Section */}
              {generatedLink && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Generated Customer Link</h3>
                  <div className="flex items-center gap-4">
                    <Input value={generatedLink} readOnly />
                    <Button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        toast.success("Link copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate Customer Link"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 