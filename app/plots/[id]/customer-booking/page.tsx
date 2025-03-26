"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

interface PlotDetails {
  plotId: string;
  plotNumber: string;
  size: string;
  plotAddress: string;
  price: number;
  dimensions: string;
  facing: string;
  employeeId: string;
}

const customerBookingSchema = z.object({
  plotId: z.string(),
  plotNumber: z.string(),
  size: z.string(),
  plotAddress: z.string(),
  price: z.string(),
  dimensions: z.string(),
  facing: z.string(),
  employeeId: z.string(),
  customerName: z.string().min(1, "Customer name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  aadhaarNumber: z.string().min(12, "Aadhaar number must be 12 digits"),
});

type CustomerBookingForm = z.infer<typeof customerBookingSchema>;

export default function CustomerBookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CustomerBookingForm>({
    resolver: zodResolver(customerBookingSchema),
    defaultValues: {
      plotId: "",
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
    const encodedData = searchParams.get("data");
    if (encodedData) {
      try {
        const decodedData = JSON.parse(atob(encodedData));
        form.reset({
          ...decodedData,
          customerName: "",
          phoneNumber: "",
          email: "",
          address: "",
          aadhaarNumber: "",
        });
      } catch (error) {
        console.error("Error decoding data:", error);
        toast.error("Invalid booking link");
        router.push("/plots");
      }
    }
  }, [searchParams, form, router]);

  const onSubmit = async (data: CustomerBookingForm) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/plots/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to book plot");
      }

      const result = await response.json();
      toast.success("Plot booked successfully!");
      
      // Get employee details from the response
      const employeeResponse = await fetch(`/api/employee/${data.employeeId}`);
      if (!employeeResponse.ok) {
        throw new Error("Failed to fetch employee details");
      }
      
      const employee = await employeeResponse.json();
      console.log('Fetched employee details:', employee);
      
      if (!employee.name || !employee.employeeRole) {
        throw new Error("Incomplete employee details received");
      }
      
      // Redirect to thank you page with booking details
      const searchParams = new URLSearchParams({
        plotNumber: data.plotNumber,
        customerName: data.customerName,
        price: data.price,
        size: data.size,
        phoneNumber: data.phoneNumber,
        email: data.email,
        employeeId: data.employeeId,
        employeeName: employee.name,
        employeeRole: employee.employeeRole,
      });
      
      console.log('Redirecting with params:', Object.fromEntries(searchParams.entries()));
      router.push(`/thank-you?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error booking plot:", error);
      toast.error(error instanceof Error ? error.message : "Failed to book plot. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Book Plot {form.getValues("plotNumber")}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
                          <Input {...field} disabled className="bg-muted/50" />
                        </FormControl>
                        <FormMessage />
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
                          <Input {...field} disabled className="bg-muted/50" />
                        </FormControl>
                        <FormMessage />
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
                          <Input {...field} disabled className="bg-muted/50" />
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
                          <Input {...field} disabled className="bg-muted/50" />
                        </FormControl>
                        <FormMessage />
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
                          <Input {...field} disabled className="bg-muted/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-muted/50" />
                        </FormControl>
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
                          <Input {...field} placeholder="Enter your full name" />
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
                          <Input {...field} type="tel" placeholder="Enter your phone number" />
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
                          <Input {...field} type="email" placeholder="Enter your email address" />
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
                          <Input {...field} placeholder="Enter your 12-digit Aadhaar number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your complete address" />
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
                  onClick={() => router.push("/plots")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Booking Plot..." : "Book Plot"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}