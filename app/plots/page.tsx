// app/plots/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Point {
  x: number;
  y: number;
}

interface PlotDetails {
  plotNumber: string;
  siteName: string;
  size: string;
  plotAddress: string;
  price: number;
  dimensions: string;
  facing: string;
  status: 'Available' | 'Sold' | 'Reserved';
}

interface Plot {
  plotNumber: string;
  coordinates: Point[];
  details?: PlotDetails;
}

interface Layout {
  id: string;
  name: string;
  image: string;
  plotAreas: Plot[];
}

const PlotsPage = () => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<Layout | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [isPlotDetailsOpen, setIsPlotDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const response = await fetch('/api/layouts');
        if (!response.ok) throw new Error('Failed to fetch layouts');
        const data = await response.json();
        setLayouts(data);
      } catch (error) {
        console.error('Error fetching layouts:', error);
        // TODO: Show error message to user
      }
    };

    fetchLayouts();
  }, []);

  const handlePlotClick = (plot: Plot) => {
    setSelectedPlot(plot);
    setIsPlotDetailsOpen(true);
  };

  const handleContactRequest = async () => {
    if (!selectedPlot?.details) return;

    try {
      const response = await fetch('/api/contact-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plotNumber: selectedPlot.details.plotNumber,
          plotId: selectedPlot.plotNumber,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit contact request');
      
      // Show success message
      setIsPlotDetailsOpen(false);
      // TODO: Show success message to user
    } catch (error) {
      console.error('Error submitting contact request:', error);
      // TODO: Show error message to user
    }
  };

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Available Plots</h1>
      </div>

      {/* Layout Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {layouts.map((layout) => (
          <Card 
            key={layout.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedLayout(layout)}
          >
            <CardContent className="p-4">
              <img 
                src={layout.image} 
                alt={layout.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <h3 className="text-lg font-semibold">{layout.name}</h3>
              <p className="text-sm text-muted-foreground">
                {layout.plotAreas.length} plots available
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Layout View */}
      {selectedLayout && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{selectedLayout.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img 
                src={selectedLayout.image} 
                alt={selectedLayout.name}
                className="w-full rounded-md"
              />
              <svg className="absolute top-0 left-0 w-full h-full">
                {selectedLayout.plotAreas.map((plot, index) => (
                  <polygon
                    key={index}
                    points={plot.coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                    className={`
                      fill-current ${plot.details?.status === 'Available' ? 'text-green-500' : 
                      plot.details?.status === 'Reserved' ? 'text-yellow-500' : 'text-red-500'}
                      opacity-30 hover:opacity-50 cursor-pointer transition-opacity
                    `}
                    onClick={() => handlePlotClick(plot)}
                  />
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plot Details Dialog */}
      <Dialog
        open={isPlotDetailsOpen}
        onOpenChange={setIsPlotDetailsOpen}
      >
        <DialogHeader>
          <DialogTitle>Plot Details</DialogTitle>
          <DialogDescription>
            View details for plot {selectedPlot?.plotNumber}
          </DialogDescription>
        </DialogHeader>
        <DialogContent className="min-w-[500px]">
          {selectedPlot?.details && (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold">Plot Number</h4>
                  <p>{selectedPlot.details.plotNumber}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Size</h4>
                  <p>{selectedPlot.details.size}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <p>{selectedPlot.details.status}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold">Site Name</h4>
                <p>{selectedPlot.details.siteName}</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Address</h4>
                <p>{selectedPlot.details.plotAddress}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Dimensions</h4>
                  <p>{selectedPlot.details.dimensions}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Facing</h4>
                  <p>{selectedPlot.details.facing}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold">Price</h4>
                <p>₹{selectedPlot.details.price.toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button
            onClick={() => setIsPlotDetailsOpen(false)}
            variant="outline"
          >
            Close
          </Button>
          <Button
            onClick={handleContactRequest}
            disabled={selectedPlot?.details?.status !== 'Available'}
          >
            Request Contact
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default PlotsPage;