"use client";

import React, { useState, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 9
  });

  const fetchLayouts = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/layouts?page=${page}&limit=${pagination.limit}`);
      const data = await response.json();
      
      if (data.data) {
        setLayouts(data.data);
        setPagination({
          currentPage: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          limit: data.pagination.limit
        });
      } else {
        // Fallback for old API format
        setLayouts(data);
      }
    } catch (error) {
      console.error("Error fetching layouts:", error);
      toast.error("Failed to fetch layouts");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLayouts(newPage);
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
        <h1 className="text-2xl font-bold">Layouts</h1>
        <Button asChild>
          <Link href="/admin/plots/create">Create New Layout</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, index) => (
            <Card key={`skeleton-${index}`} className="animate-pulse">
              <CardHeader className="h-16 bg-gray-200 rounded-t-lg"></CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="h-60 bg-gray-200 rounded-md"></div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
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
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{layout._count?.Plot || layout.Plot?.length || 0} plots</span>
                      <span>
                        Created {format(new Date(layout.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/admin/plots/${layout.id}/edit`}>
                        Edit Layout
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === pagination.totalPages || 
                    (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <Button variant="outline" disabled>...</Button>
                      )}
                      <Button
                        variant={pagination.currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))
                }
                
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 