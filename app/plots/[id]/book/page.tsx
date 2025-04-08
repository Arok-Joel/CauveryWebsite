"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { use } from 'react';

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
  employeeRole: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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
  employeeId: z.string().min(1, "Please select an employee"),
  
  // Customer Details
  customerName: z.string().min(1, "Customer name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  aadhaarNumber: z.string().min(12, "Aadhaar number must be 12 digits"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function BookPlotPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [plot, setPlot] = useState<Plot | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      plotNumber: "",
      size: "",
      plotAddress: "",
      price: "",
      dimensions: "",
      facing: "",
      employeeId: "",
      customerName: "",
      phoneNumber: "",
      email: "",
      address: "",
      aadhaarNumber: "",
    },
  });

  useEffect(() => {
    // Fetch plot details
    const fetchPlot = async () => {
      try {
        const response = await fetch(`/api/plots/${id}`);
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

    // Fetch employees
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees");
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch employees");
        }
        
        setEmployees(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error fetching employees");
      }
    };

    fetchPlot();
    fetchEmployees();
  }, [id, form, router]);

  const onSubmit = async (data: BookingFormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/plots/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          plotId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        
        if (errorData.error && errorData.error.includes("transaction timeout")) {
          // Handle transaction timeout specifically
          toast.info("Your booking is being processed. You may receive a confirmation email shortly, but please check with admin to confirm the booking was completed.");
          throw new Error("Transaction timeout - your booking might still be processing");
        } else {
          throw new Error(errorData.error || "Failed to book plot");
        }
      }

      const result = await response.json();
      toast.success("Plot booked successfully!");
      
      // Redirect to thank you page with booking details
      const searchParams = new URLSearchParams({
        plotNumber: data.plotNumber,
        customerName: data.customerName,
        price: data.price,
        size: data.size,
        phoneNumber: data.phoneNumber,
        email: data.email,
      });
      
      // Get the selected employee details
      const selectedEmployee = employees.find(emp => emp.id === data.employeeId);
      if (selectedEmployee) {
        searchParams.append('employeeId', selectedEmployee.id);
        searchParams.append('employeeName', selectedEmployee.name);
        searchParams.append('employeeRole', selectedEmployee.employeeRole);
        
        // Debug logging
        console.log('Adding employee details to URL:', {
          id: selectedEmployee.id,
          name: selectedEmployee.name,
          role: selectedEmployee.employeeRole
        });
      }
      
      router.push(`/thank-you?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error booking plot:", error);
      
      if (error instanceof Error && error.message.includes("transaction timeout")) {
        toast.error("The booking process is taking longer than expected. If you received a confirmation email, your booking was likely successful. Please contact support to confirm.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to book plot. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!plot) {
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

              {/* Employee Selection Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Employee Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Employee</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name} ({employee.employeeRole})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Customer Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aadhaarNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhaar Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
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