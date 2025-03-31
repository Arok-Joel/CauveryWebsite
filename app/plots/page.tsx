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
import { Button } from "@/components/ui/button";
import { LayoutGrid, Map } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"map" | "cards">("map");
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
      
      // Parse plot images for each layout
      const layoutsWithParsedImages = data.map((layout: Layout) => ({
        ...layout,
        Plot: layout.Plot.map((plot: any) => {
          let parsedImages: PlotImage[] = [];
          try {
            if (plot.images && typeof plot.images === 'string' && plot.images.trim() !== '') {
              const imagesData = plot.images.trim();
              if (imagesData !== '[]') {
                let parsedData = JSON.parse(imagesData);
                if (typeof parsedData === 'string') {
                  parsedData = JSON.parse(parsedData);
                }
                if (Array.isArray(parsedData)) {
                  parsedImages = parsedData
                    .map(img => ({
                      url: typeof img.url === 'string' ? img.url : '',
                      caption: typeof img.caption === 'string' ? img.caption : undefined
                    }))
                    .filter(img => img.url);
                }
              }
            }
          } catch (error) {
            console.error('Error parsing plot images:', error);
          }
          return {
            ...plot,
            images: parsedImages
          };
        })
      }));
      
      setLayouts(layoutsWithParsedImages);
    } catch (error) {
      console.error("Error fetching layouts:", error);
    }
  };

  const handlePlotClick = (plotId: string) => {
    router.push(`/plots/${plotId}`);
  };

  if (!selectedLayout) return null;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#3C5A3E]/10 border-r border-[#3C5A3E]/20">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-[#3C5A3E]">Layout Selection</h2>
          <Select
            value={selectedLayout?.id}
            onValueChange={(value) => {
              const layout = layouts.find(l => l.id === value);
              if (layout) setSelectedLayout(layout);
            }}
          >
            <SelectTrigger className="w-full bg-white/50 border border-[#3C5A3E]/20 text-[#3C5A3E] hover:bg-white/80 transition-colors">
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
            <div className="mt-8 space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#3C5A3E] uppercase tracking-wider">Layout Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#3C5A3E]/70">Name</span>
                    <span className="text-sm font-medium text-[#3C5A3E]">{selectedLayout.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#3C5A3E]/70">Total Plots</span>
                    <span className="text-sm font-medium text-[#3C5A3E]">{selectedLayout.Plot.length}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#3C5A3E] uppercase tracking-wider">Plot Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#3C5A3E]/20 border border-[#3C5A3E] rounded-sm"></div>
                      <span className="text-sm text-[#3C5A3E]/90">Available</span>
                    </div>
                    <span className="text-sm font-medium text-[#3C5A3E]">
                      {selectedLayout.Plot.filter(plot => plot.status === "available").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded-sm"></div>
                      <span className="text-sm text-[#3C5A3E]/90">Sold</span>
                    </div>
                    <span className="text-sm font-medium text-[#3C5A3E]">
                      {selectedLayout.Plot.filter(plot => plot.status === "sold").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500/20 border border-orange-500 rounded-sm"></div>
                      <span className="text-sm text-[#3C5A3E]/90">Reserved</span>
                    </div>
                    <span className="text-sm font-medium text-[#3C5A3E]">
                      {selectedLayout.Plot.filter(plot => plot.status === "reserved").length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#3C5A3E] uppercase tracking-wider">View Mode</h3>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "map" ? "default" : "outline"}
                    className={`flex-1 ${
                      viewMode === "map" 
                        ? "bg-[#3C5A3E] hover:bg-[#2d4330] text-white" 
                        : "bg-white/50 hover:bg-white/80 text-[#3C5A3E] border-[#3C5A3E]/20"
                    } transition-colors`}
                    onClick={() => setViewMode("map")}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Layout
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    className={`flex-1 ${
                      viewMode === "cards" 
                        ? "bg-[#3C5A3E] hover:bg-[#2d4330] text-white" 
                        : "bg-white/50 hover:bg-white/80 text-[#3C5A3E] border-[#3C5A3E]/20"
                    } transition-colors`}
                    onClick={() => setViewMode("cards")}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Cards
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-white">
        {viewMode === "map" ? (
          <div className="relative w-full h-[calc(100vh-64px)]">
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
                        : hoveredPlotId === plot.id ? "rgba(60, 90, 62, 0.4)" : "rgba(60, 90, 62, 0.2)"
                    }
                    stroke={
                      plot.status === "sold"
                        ? "#ff0000"
                        : plot.status === "reserved"
                        ? "#ffa500"
                        : "#3C5A3E"
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
        ) : (
          <div className="p-6 grid grid-cols-1 gap-6">
            {selectedLayout.Plot.map((plot) => (
              <Card 
                key={plot.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group border-2 flex flex-row h-[200px]"
                onClick={() => handlePlotClick(plot.id)}
              >
                <div className={`w-1.5 h-full ${
                  plot.status === "sold" ? "bg-red-500" :
                  plot.status === "reserved" ? "bg-orange-500" :
                  "bg-[#3C5A3E]"
                }`} />
                <div className="relative w-[300px] h-full bg-gray-100">
                  {plot.images && Array.isArray(plot.images) && plot.images[0] && plot.images[0].url ? (
                    <Image
                      src={plot.images[0].url}
                      alt={`Plot ${plot.plotNumber}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show fallback content
                        const parent = target.parentElement;
                        if (parent) {
                          parent.classList.add('flex', 'items-center', 'justify-center');
                          parent.innerHTML = '<p class="text-gray-500">Image not available</p>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <CardHeader className="pb-2 pt-4 px-6">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-2xl font-bold">Plot {plot.plotNumber}</CardTitle>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        plot.status === "sold" ? "bg-red-100 text-red-700" :
                        plot.status === "reserved" ? "bg-orange-100 text-orange-700" :
                        "bg-[#E8EFE8] text-[#3C5A3E]"
                      }`}>
                        {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Size</span>
                        <p className="text-base font-semibold">{plot.size}</p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Facing</span>
                        <p className="text-base font-semibold">{plot.facing}</p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Dimensions</span>
                        <p className="text-base font-semibold">{plot.dimensions}</p>
                      </div>
                    </div>
                    <div className="pt-4 mt-auto border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Price</span>
                        <span className="text-xl font-bold text-[#3C5A3E]">₹{plot.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

