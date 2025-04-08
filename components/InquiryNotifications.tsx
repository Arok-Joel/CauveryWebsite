"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface InquiryStatus {
  id: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  inquiry: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    preferredLanguage: string;
    preferredTime?: string;
    message?: string;
    plot?: {
      plotNumber: string;
      size: string;
      price: number;
    };
  };
}

interface InquiryNotificationsProps {
  fieldOfficerId: string;
}

export function InquiryNotifications({ fieldOfficerId }: InquiryNotificationsProps) {
  const [inquiries, setInquiries] = useState<InquiryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const fetchInquiries = async () => {
    try {
      const response = await fetch(`/api/inquiries?fieldOfficerId=${fieldOfficerId}`);
      if (!response.ok) throw new Error("Failed to fetch inquiries");
      const data = await response.json();
      setInquiries(data);
    } catch (error) {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    // Set up polling for new inquiries every minute
    const interval = setInterval(fetchInquiries, 60000);
    return () => clearInterval(interval);
  }, [fieldOfficerId]);

  const handleStatusUpdate = async (inquiryStatusId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/inquiries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiryStatusId,
          status: newStatus,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success("Status updated successfully");
      setSelectedInquiry(null);
      setNotes("");
      fetchInquiries();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div>Loading inquiries...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Customer Inquiries</h2>
      {inquiries.length === 0 ? (
        <p>No new inquiries</p>
      ) : (
        inquiries.map((inquiry) => (
          <Card key={inquiry.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {inquiry.inquiry.name}
                  <Badge
                    className="ml-2"
                    variant={
                      inquiry.status === "Pending"
                        ? "default"
                        : inquiry.status === "Contacted"
                        ? "secondary"
                        : "success"
                    }
                  >
                    {inquiry.status}
                  </Badge>
                </CardTitle>
                <span className="text-sm text-gray-500">
                  {format(new Date(inquiry.createdAt), "PPp")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Phone:</strong> {inquiry.inquiry.phone}
                </p>
                {inquiry.inquiry.email && (
                  <p>
                    <strong>Email:</strong> {inquiry.inquiry.email}
                  </p>
                )}
                <p>
                  <strong>Preferred Language:</strong>{" "}
                  {inquiry.inquiry.preferredLanguage}
                </p>
                {inquiry.inquiry.preferredTime && (
                  <p>
                    <strong>Preferred Time:</strong>{" "}
                    {inquiry.inquiry.preferredTime}
                  </p>
                )}
                {inquiry.inquiry.plot && (
                  <p>
                    <strong>Plot:</strong> {inquiry.inquiry.plot.plotNumber} (
                    {inquiry.inquiry.plot.size})
                  </p>
                )}
                {inquiry.inquiry.message && (
                  <p>
                    <strong>Message:</strong> {inquiry.inquiry.message}
                  </p>
                )}
                {inquiry.notes && (
                  <p>
                    <strong>Notes:</strong> {inquiry.notes}
                  </p>
                )}

                {selectedInquiry === inquiry.id ? (
                  <div className="space-y-2 mt-4">
                    <Textarea
                      placeholder="Add notes about the interaction..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(inquiry.id, "Contacted")}
                      >
                        Mark as Contacted
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInquiry(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  inquiry.status === "Pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInquiry(inquiry.id)}
                    >
                      Update Status
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
} 