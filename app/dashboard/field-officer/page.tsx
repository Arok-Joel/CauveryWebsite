"use client";

import { useEffect, useState } from "react";
import { InquiryNotifications } from "@/components/InquiryNotifications";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function FieldOfficerDashboard() {
  const [fieldOfficerId, setFieldOfficerId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        
        const data = await response.json();
        if (data.employee?.employeeRole !== "FIELD_OFFICER") {
          router.push("/dashboard");
          return;
        }
        
        setFieldOfficerId(data.employee.id);
      } catch (error) {
        toast.error("Please log in to access this page");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  if (!fieldOfficerId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Field Officer Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {/* Main content area */}
          <div className="space-y-8">
            {/* Add other dashboard components here */}
          </div>
        </div>
        <div className="lg:col-span-4">
          {/* Notifications sidebar */}
          <InquiryNotifications fieldOfficerId={fieldOfficerId} />
        </div>
      </div>
    </div>
  );
} 