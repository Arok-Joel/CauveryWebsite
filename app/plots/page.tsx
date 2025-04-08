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
import React from "react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading layout data...");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Improved cache with timeout
  const layoutCache = React.useRef<Record<string, {
    layouts: Layout[];
    pagination: {
      currentPage: number;
      totalPages: number;
      limit: number;
    },
    timestamp: number
  }>>({});
  
  // Cache timeout - 10 minutes
  const CACHE_TIMEOUT = 10 * 60 * 1000;

  useEffect(() => {
    fetchLayouts(1);
  }, []);

  useEffect(() => {
    if (layouts.length > 0 && !selectedLayout) {
      setSelectedLayout(layouts[0]);
    }
  }, [layouts, selectedLayout]);

  // Separate effect for loading image dimensions
  useEffect(() => {
    if (selectedLayout && selectedLayout.image) {
      setIsImageLoading(true);
      
      const img = new window.Image();
      
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setIsImageLoading(false);
      };
      
      img.onerror = () => {
        console.error('Error loading layout image');
        setImageSize({ width: 1000, height: 800 });
        setIsImageLoading(false);
      };
      
      const timeout = setTimeout(() => {
        setImageSize({ width: 1000, height: 800 });
        setIsImageLoading(false);
      }, 5000);
      
      img.src = selectedLayout.image;
      
      return () => clearTimeout(timeout);
    }
  }, [selectedLayout]);

  const fetchLayouts = async (page: number) => {
    // Reset error state when trying a new fetch
    setError(null);
    
    // Return cached data if available for this page and not expired
    const cacheKey = `layouts-page-${page}-limit-${pagination.limit}`;
    const now = Date.now();
    
    if (layoutCache.current[cacheKey] && 
        (now - layoutCache.current[cacheKey].timestamp) < CACHE_TIMEOUT) {
      console.log('Using cached layout data for page', page);
      const cachedData = layoutCache.current[cacheKey];
      setLayouts(cachedData.layouts);
      setPagination(cachedData.pagination);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadingMessage("Loading layout data...");
      setLoadingProgress(10);
      
      console.log(`Fetching layouts for page ${page} with limit ${pagination.limit}`);
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const startFetch = performance.now();
      setLoadingMessage("Requesting layouts from server...");
      
      const response = await fetch(
        `/api/layouts?page=${page}&limit=${pagination.limit}&withPlots=true`, 
        { signal: controller.signal }
      );
      
      setLoadingProgress(40);
      setLoadingMessage("Processing layout data...");
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setLoadingProgress(70);
      
      if (data.error) {
        throw new Error(`API error: ${data.error}`);
      }
      
      if (data.data) {
        setLoadingMessage("Processing layout images...");
        setLoadingProgress(80);
        
        // New paginated API
        const layoutsWithParsedImages = data.data.map(processLayoutImages);
        setLayouts(layoutsWithParsedImages);
        
        const paginationData = {
          currentPage: data.pagination.page,
          totalPages: data.pagination.totalPages,
          limit: data.pagination.limit
        };
        
        setPagination(paginationData);
        
        const fetchTime = Math.round((performance.now() - startFetch) / 100) / 10;
        
        // Cache the processed data with timestamp
        layoutCache.current[cacheKey] = {
          layouts: layoutsWithParsedImages,
          pagination: paginationData,
          timestamp: now
        };
        
        setLoadingMessage(`Layouts loaded in ${fetchTime}s`);
        setLoadingProgress(100);
      } else {
        // Legacy API format
        const layoutsWithParsedImages = data.map(processLayoutImages);
        setLayouts(layoutsWithParsedImages);
      }
      
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setLoadingMessage("Failed to load layouts");
      setLoadingProgress(0);
    } finally {
      // Add slight delay before removing loading indicator for better UX
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  // Process layout images in a more efficient way
  const processLayoutImages = (layout: Layout) => ({
    ...layout,
    Plot: (layout.Plot || []).map((plot: any) => {
      // Ensure plot is an object with required fields
      if (!plot || typeof plot !== 'object') {
        return {
          id: 'unknown',
          plotNumber: 'Unknown',
          status: 'unknown',
          coordinates: [],
          images: [],
          price: 0,
          size: 'Unknown',
          dimensions: 'Unknown',
          facing: 'Unknown'
        };
      }
      
      let parsedImages: PlotImage[] = [];
      let parsedCoordinates = plot.coordinates || [];
      
      // Parse images if needed
      if (plot.images && typeof plot.images === 'string') {
        try {
          // Try to parse JSON safely
          const imagesData = plot.images.trim();
          if (imagesData && imagesData !== '[]') {
            // Use a single parse attempt with try/catch
            const parsed = JSON.parse(imagesData);
            const imageArray = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
            
            if (Array.isArray(imageArray)) {
              parsedImages = imageArray
                .filter(img => img && img.url)
                .map(img => ({
                  url: img.url,
                  caption: img.caption || undefined
                }));
            }
          }
        } catch (error) {
          // Silent error - just return empty array
          console.error('Error parsing images for plot:', plot.id);
        }
      }
      
      // Parse coordinates if needed
      if (typeof plot.coordinates === 'string') {
        try {
          parsedCoordinates = JSON.parse(plot.coordinates);
          if (!Array.isArray(parsedCoordinates)) {
            parsedCoordinates = [];
          }
        } catch (error) {
          console.error('Error parsing coordinates for plot:', plot.id);
          parsedCoordinates = [];
        }
      }
      
      // Return plot with all required fields and default values for missing ones
      return {
        id: plot.id || 'unknown',
        plotNumber: plot.plotNumber || 'Unknown',
        status: plot.status || 'unknown',
        coordinates: parsedCoordinates,
        images: parsedImages,
        price: typeof plot.price === 'number' ? plot.price : 0,
        size: plot.size || 'Unknown',
        dimensions: plot.dimensions || 'Unknown',
        facing: plot.facing || 'Unknown'
      };
    })
  });

  const handlePlotClick = (plotId: string) => {
    router.push(`/plots/${plotId}`);
  };

  // Debounced layout selection to prevent rapid re-renders
  const debouncedSetSelectedLayout = React.useCallback((layout: Layout | null) => {
    // Show loading indicator while image loads
    if (layout?.image) {
      setIsImageLoading(true);
    }
    
    // Set layout after a small delay
    setTimeout(() => {
      setSelectedLayout(layout);
    }, 100);
  }, []);

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
              if (layout) debouncedSetSelectedLayout(layout);
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
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-64px)]">
            <div className="text-center space-y-5">
              <div className="inline-block w-16 h-16 border-4 border-[#3C5A3E] border-t-transparent rounded-full animate-spin"></div>
              <div className="space-y-2">
                <p className="text-xl font-medium text-[#3C5A3E]">{loadingMessage}</p>
                {error ? (
                  <p className="text-sm text-red-500">
                    {error}. <button onClick={() => fetchLayouts(pagination.currentPage)} className="text-blue-500 underline">Try again</button>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    This may take 10-15 seconds the first time as we load all plot details.
                  </p>
                )}
                <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-[#3C5A3E] transition-all duration-300 rounded-full" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-400">Future loads will be much faster due to caching.</p>
            </div>
          </div>
        ) : viewMode === "map" ? (
          <div className="relative w-full h-[calc(100vh-64px)]">
            {selectedLayout.image && (
              <div className="relative w-full h-full">
                <Image
                  src={selectedLayout.image}
                  alt={selectedLayout.name}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority={false}
                  loading="lazy"
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEggI73Jt/8QAAAABJRU5ErkJggg=="
                />
              </div>
            )}
            
            <svg
              className="absolute top-0 left-0 w-full h-full"
              viewBox={`0 0 ${imageSize.width || 1000} ${imageSize.height || 800}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="hover-shadow">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
                </filter>
              </defs>
              
              {selectedLayout.Plot.map((plot) => (
                <g key={plot.id}>
                  {plot.coordinates && Array.isArray(plot.coordinates) && plot.coordinates.length > 0 ? (
                    <>
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
                    </>
                  ) : (
                    // Fallback for plots without coordinates
                    <text 
                      x={20} 
                      y={20 + (selectedLayout.Plot.indexOf(plot) * 30)} 
                      fill="#000" 
                      fontSize="14" 
                      onClick={() => handlePlotClick(plot.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      Plot {plot.plotNumber} ({plot.status})
                    </text>
                  )}
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

