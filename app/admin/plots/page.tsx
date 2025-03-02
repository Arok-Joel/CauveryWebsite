"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Layout {
  id: string;
  name: string;
  image: string;
  createdAt: Date;
  Plot: any[];
  _count?: {
    Plot: number;
  };
}

export default function PlotsAdminPage() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLayouts = async () => {
    try {
      const response = await fetch("/api/layouts");
      const data = await response.json();
      setLayouts(data);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      toast.error("Failed to fetch layouts");
    }
  };

  const handleDeleteLayout = async (layoutId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/layouts?id=${layoutId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete layout");
      }

      // Remove the layout from the state
      setLayouts(layouts.filter((layout) => layout.id !== layoutId));
      toast.success("Layout deleted successfully");
    } catch (error) {
      console.error("Error deleting layout:", error);
      toast.error("Failed to delete layout");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch layouts when component mounts
  useEffect(() => {
    fetchLayouts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Plot Layouts</h2>
        <Button asChild>
          <Link href="/admin/plots/create">Create New Layout</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {layouts.map((layout) => (
          <Card key={layout.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{layout.name}</CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Layout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this layout? This action will also delete all plots associated with this layout and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteLayout(layout.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-md">
                  <Image
                    src={layout.image}
                    alt={layout.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{layout._count?.Plot || layout.Plot.length} plots</span>
                  <span>
                    Created {format(new Date(layout.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/plots/${layout.id}/layout`}>
                    View Layout
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 