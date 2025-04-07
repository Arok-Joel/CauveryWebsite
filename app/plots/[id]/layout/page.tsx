"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Move } from "lucide-react";
import { use } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Plot {
  id: string;
  coordinates: Point[];
}

interface Layout {
  id: string;
  name: string;
  image: string;
  Plot: Plot[];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PlotLayoutPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState<"move" | null>(null);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const response = await fetch(`/api/layouts/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch layout');
        }
        const data = await response.json();
        setLayout(data);
      } catch (error) {
        console.error('Error fetching layout:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [id]);

  useEffect(() => {
    if (!layout) return;
    drawCanvas();
  }, [layout, scale, offset]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    const img = new Image();
    img.src = layout.image;
    img.onload = () => {
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw plots
      layout.Plot.forEach((plot) => {
        if (plot.coordinates.length > 1) {
          ctx.beginPath();
          ctx.moveTo(plot.coordinates[0].x, plot.coordinates[0].y);
          plot.coordinates.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.closePath();
          ctx.fillStyle = "rgba(0, 123, 255, 0.2)";
          ctx.fill();
          ctx.strokeStyle = "#007bff";
          ctx.stroke();
        }
      });

      ctx.restore();
    };
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === "move" || !layout) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offset.x) / scale;
    const y = (event.clientY - rect.top - offset.y) / scale;

    // Check if click is inside any plot
    layout.Plot.forEach((plot) => {
      if (isPointInPolygon({ x, y }, plot.coordinates)) {
        router.push(`/plots/${plot.id}`);
      }
    });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === "move") {
      setIsDragging(true);
      setDragStart({ x: event.clientX - offset.x, y: event.clientY - offset.y });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && dragStart) {
      setOffset({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  // Helper function to check if a point is inside a polygon
  const isPointInPolygon = (point: Point, polygon: Point[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  };

  if (!layout) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{layout.name}</h1>
        <div className="flex gap-2">
          <Button
            variant={selectedTool === "move" ? "default" : "outline"}
            onClick={() => setSelectedTool(selectedTool === "move" ? null : "move")}
          >
            <Move className="mr-2 h-4 w-4" />
            Move
          </Button>
          <Button variant="outline" onClick={() => setScale(scale * 1.2)}>
            <ZoomIn className="mr-2 h-4 w-4" />
            Zoom In
          </Button>
          <Button variant="outline" onClick={() => setScale(scale / 1.2)}>
            <ZoomOut className="mr-2 h-4 w-4" />
            Zoom Out
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="border border-gray-200"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </CardContent>
      </Card>
    </div>
  );
} 