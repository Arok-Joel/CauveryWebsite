"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChangeEvent } from "react";

interface ContactSalesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plotId?: string;
  plotNumber?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  preferredLanguage: string;
  preferredTime: string;
  message: string;
}

export function ContactSalesDialog({ isOpen, onClose, plotId, plotNumber }: ContactSalesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    preferredLanguage: "English",
    preferredTime: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          plotId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit inquiry");
      }

      toast.success("Your inquiry has been submitted successfully!");
      onClose();
      setFormData({
        name: "",
        phone: "",
        email: "",
        preferredLanguage: "English",
        preferredTime: "",
        message: ""
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleLanguageChange = (value: string) => {
    setFormData(prev => ({ ...prev, preferredLanguage: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Sales Team</DialogTitle>
          <DialogDescription>
            {plotNumber ? `Inquiring about Plot ${plotNumber}` : "Fill in your details and our team will contact you shortly"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name *</label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">Phone Number *</label>
            <Input
              id="phone"
              required
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">Preferred Language</label>
            <Select
              value={formData.preferredLanguage}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Tamil">Tamil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="preferredTime" className="text-sm font-medium">Preferred Contact Time</label>
            <Input
              id="preferredTime"
              placeholder="e.g., Morning, Afternoon, Evening"
              value={formData.preferredTime}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">Message</label>
            <Textarea
              id="message"
              placeholder="Any specific questions or requirements?"
              value={formData.message}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 