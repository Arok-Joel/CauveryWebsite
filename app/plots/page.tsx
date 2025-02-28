"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Point {
  x: number;
  y: number;
}

interface PlotImage {
  url: string;
  caption?: string;
}

interface Plot {
  id: string;
  plotNumber: string;
  size: string;
  plotAddress: string;
  price: number;
  dimensions: string;
  facing: string;
  status: string;
  coordinates: Point[];
  images: string;
}

interface PlotWithParsedImages extends Omit<Plot, 'images'> {
  images: PlotImage[];
}

interface Layout {
  id: string;
  name: string;
  image: string;
  Plot: Plot[];
}

export default function PlotsPage() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<Layout | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [hoveredPlotId, setHoveredPlotId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLayouts();
  }, []);

  useEffect(() => {
    if (layouts.length > 0 && !selectedLayout) {
      setSelectedLayout(layouts[0]);
    }
  }, [layouts]);

  useEffect(() => {
    if (selectedLayout && selectedLayout.image) {
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = selectedLayout.image;
    }
  }, [selectedLayout]);

  const fetchLayouts = async () => {
    try {
      const response = await fetch("/api/layouts");
      const data = await response.json();
      setLayouts(data);
    } catch (error) {
      console.error("Error fetching layouts:", error);
    }
  };

  const handlePlotClick = (plotId: string) => {
    router.push(`/plots/${plotId}`);
  };

  if (!selectedLayout) return null;

  return (
    <div className="flex">
      {/* Side Panel */}
      <div className="w-64 min-h-screen bg-[#0f172a] text-white fixed left-0 top-[64px] bottom-0 z-10">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Layout Selection</h2>
          <Select
            value={selectedLayout?.id}
            onValueChange={(value) => {
              const layout = layouts.find(l => l.id === value);
              if (layout) setSelectedLayout(layout);
            }}
          >
            <SelectTrigger className="w-full bg-[#1e293b] border-0 text-white">
              <SelectValue placeholder="Select a layout" />
            </SelectTrigger>
            <SelectContent>
              {layouts.map(layout => (
                <SelectItem key={layout.id} value={layout.id}>
                  {layout.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedLayout && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Layout Details</h3>
                <div className="space-y-2">
                  <p className="text-sm">Name: {selectedLayout.name}</p>
                  <p className="text-sm">Total Plots: {selectedLayout.Plot.length}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Plot Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/20 border border-green-500"></div>
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500/20 border border-red-500"></div>
                    <span className="text-sm">Sold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500/20 border border-orange-500"></div>
                    <span className="text-sm">Reserved</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pl-64 pt-[64px]">
        <div 
          className="relative mx-2 flex items-center justify-center"
          style={{
            width: '100%',
            height: 'calc(100vh - 64px)',
          }}
        >
          <div
            className="relative"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '100%',
              maxWidth: '100%',
            }}
          >
            {selectedLayout.image && (
              <Image
                src={selectedLayout.image}
                alt={selectedLayout.name}
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            )}
            
            <svg
              className="absolute top-0 left-0 w-full h-full"
              viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="hover-shadow">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
                </filter>
              </defs>
              
              {selectedLayout.Plot.map((plot) => (
                <g key={plot.id}>
                  <polygon
                    points={plot.coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={
                      plot.status === "sold"
                        ? hoveredPlotId === plot.id ? "rgba(255, 0, 0, 0.4)" : "rgba(255, 0, 0, 0.2)"
                        : plot.status === "reserved"
                        ? hoveredPlotId === plot.id ? "rgba(255, 165, 0, 0.4)" : "rgba(255, 165, 0, 0.2)"
                        : hoveredPlotId === plot.id ? "rgba(0, 255, 0, 0.4)" : "rgba(0, 255, 0, 0.2)"
                    }
                    stroke={
                      plot.status === "sold"
                        ? "#ff0000"
                        : plot.status === "reserved"
                        ? "#ffa500"
                        : "#00ff00"
                    }
                    strokeWidth={hoveredPlotId === plot.id ? "2" : "1"}
                    style={{
                      cursor: 'pointer',
                      filter: hoveredPlotId === plot.id ? 'url(#hover-shadow)' : 'none',
                      transform: hoveredPlotId === plot.id ? 'translate(-2px, -2px)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={() => setHoveredPlotId(plot.id)}
                    onMouseLeave={() => setHoveredPlotId(null)}
                    onClick={() => handlePlotClick(plot.id)}
                  />
                  <text
                    x={plot.coordinates.reduce((sum, p) => sum + p.x, 0) / plot.coordinates.length}
                    y={plot.coordinates.reduce((sum, p) => sum + p.y, 0) / plot.coordinates.length}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#000"
                    fontSize={hoveredPlotId === plot.id ? "16" : "14"}
                    pointerEvents="none"
                    style={{ transition: 'font-size 0.2s ease' }}
                  >
                    {plot.plotNumber}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}