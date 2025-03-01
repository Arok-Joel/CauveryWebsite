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
  price: z.number().min(0, "Price must be a positive number"),
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

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      plotNumber: "",
      size: "",
      plotAddress: "",
      price: 0,
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
        form.setValue("price", data.price);
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

  const onSubmit = async (data: BookingFormValues) => {
    try {
      setIsLoading(true);
      // TODO: Implement booking API endpoint
      const response = await fetch("/api/plots/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plotId: params.id,
          ...data,
        }),
      });

      if (!response.ok) throw new Error("Failed to book plot");

      toast.success("Plot booked successfully!");
      router.push(`/plots/${params.id}`);
    } catch (error) {
      toast.error("Failed to book plot");
    } finally {
      setIsLoading(false);
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
          <CardTitle className="text-2xl">Book Plot {plot.plotNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                            type="number"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                  {isLoading ? "Booking..." : "Book Plot"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 