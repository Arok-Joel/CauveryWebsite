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

// Custom CSS for arrow animation
const arrowBounceStyle = `
  @keyframes custom-bounce {
    0%, 100% {
      transform: translateY(0);
      opacity: 0.9;
    }
    50% {
      transform: translateY(-20px);
      opacity: 1;
    }
  }
  .arrow-bounce {
    animation: custom-bounce 1.8s infinite ease-in-out;
    transform-origin: center bottom;
  }
  @keyframes custom-pulse {
    0% {
      opacity: 0.5;
      transform: scale(0.95);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      opacity: 0.5;
      transform: scale(0.95);
    }
  }
  .marker-pulse {
    animation: custom-pulse 2s infinite;
  }
  
  .arrow-head {
    stroke-width: 2;
  }
  
  .arrow-stem {
    stroke-width: 8;
    stroke-linecap: round;
  }
`;

export default function PlotsPage() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<Layout | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1000, height: 800 });
  const [svgViewBox, setSvgViewBox] = useState("0 0 1000 800"); // Separate state for SVG viewBox
  const [hoveredPlotId, setHoveredPlotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "cards">("map");
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [plotSearch, setPlotSearch] = useState(""); // Input value for search
  const [searchQuery, setSearchQuery] = useState(""); // Actual search term (updated on button click)
  const [foundPlots, setFoundPlots] = useState<Plot[]>([]); // Track found plots
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
  
  // Track image dimensions cache with layout ID
  const imageDimensionsCache = React.useRef<Record<string, { width: number, height: number }>>({});

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
      // Check if we already have the dimensions in cache
      if (imageDimensionsCache.current[selectedLayout.id]) {
        const cachedDimensions = imageDimensionsCache.current[selectedLayout.id];
        setImageSize(cachedDimensions);
        // Don't update SVG viewBox when changing layouts to prevent jumping
        return;
      }
      
      setIsImageLoading(true);
      
      // Keep stable dimensions until new ones are fully loaded
      const img = new window.Image();
      
      img.onload = () => {
        const newDimensions = { width: img.width, height: img.height };
        setImageSize(newDimensions);
        imageDimensionsCache.current[selectedLayout.id] = newDimensions;
        
        // Only set the SVG viewBox once during initial load
        if (!imageDimensionsCache.current['initial_set']) {
          setSvgViewBox(`0 0 ${img.width} ${img.height}`);
          imageDimensionsCache.current['initial_set'] = { width: img.width, height: img.height };
        }
        
        setIsImageLoading(false);
      };
      
      img.onerror = () => {
        console.error('Error loading layout image');
        const fallbackDimensions = { width: 1000, height: 800 };
        setImageSize(fallbackDimensions);
        imageDimensionsCache.current[selectedLayout.id] = fallbackDimensions;
        setIsImageLoading(false);
      };
      
      // Set a longer timeout for large images
      const timeout = setTimeout(() => {
        console.warn('Image loading timed out, using fallback dimensions');
        const fallbackDimensions = { width: 1000, height: 800 };
        setImageSize(fallbackDimensions);
        imageDimensionsCache.current[selectedLayout.id] = fallbackDimensions;
        setIsImageLoading(false);
      }, 8000); // Increased timeout
      
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
    if (!layout) {
      setSelectedLayout(null);
      return;
    }
    
    // Show loading indicator while image loads
    if (layout?.image) {
      setIsImageLoading(true);
      
      // If we already have dimensions in cache, use them immediately for the image
      // but DO NOT change the SVG viewBox to prevent plot relocation
      if (imageDimensionsCache.current[layout.id]) {
        setImageSize(imageDimensionsCache.current[layout.id]);
      }
    }
    
    // Set layout immediately to prevent jump
      setSelectedLayout(layout);
  }, []);

  // Function to handle plot search
  const handlePlotSearch = (event?: React.FormEvent) => {
    // Prevent form submission default behavior if event exists
    if (event) event.preventDefault();
    
    if (!selectedLayout) return;
    
    // Update the searchQuery state with the current plotSearch value
    setSearchQuery(plotSearch);
    
    if (!plotSearch.trim()) {
      setFoundPlots([]);
      return;
    }
    
    const normalizedSearch = plotSearch.trim().toLowerCase();
    
    // Find plots that exactly match the search term
    const matches = selectedLayout.Plot.filter(plot => 
      plot.plotNumber.toLowerCase() === normalizedSearch
    );
    
    setFoundPlots(matches);
  };

  // Handle input change without searching
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlotSearch(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setPlotSearch("");
    setSearchQuery("");
    setFoundPlots([]);
  };

  if (!selectedLayout) return null;

  return (
    <div className="min-h-screen flex">
      {/* Add the custom CSS for animations */}
      <style jsx global>{arrowBounceStyle}</style>
      
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

              {/* Search box for plots */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#3C5A3E] uppercase tracking-wider">Find Plot</h3>
                <form onSubmit={handlePlotSearch} className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={plotSearch}
                      onChange={handleSearchInputChange}
                      placeholder="Enter exact plot number..."
                      className="w-full p-2 pl-8 border border-[#3C5A3E] rounded-md bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#3C5A3E]/30 focus:border-[#3C5A3E] text-sm"
                    />
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 absolute top-3 left-2 text-[#3C5A3E]" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {plotSearch && (
                      <button
                        type="button"
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        onClick={clearSearch}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-[#3C5A3E] text-white rounded-md hover:bg-[#2d4330] transition-colors text-sm font-medium"
                  >
                    Search Plot
                  </button>
                </form>
                <div className="text-xs text-[#3C5A3E]">
                  Must match plot number exactly
                </div>
                {/* Search results summary */}
                {searchQuery && (
                  <div className="text-sm">
                    {foundPlots.length > 0 ? (
                      <p className="text-[#3C5A3E]">Found {foundPlots.length} plot{foundPlots.length !== 1 ? 's' : ''}</p>
                    ) : (
                      <p className="text-red-500">No plots found</p>
                    )}
                  </div>
                )}
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
            {/* Display a search prompt if no plots are being shown */}
            {searchQuery.trim() === "" && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white p-8 rounded-lg shadow-xl text-center max-w-md border-2 border-[#3C5A3E]">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#3C5A3E] text-white px-6 py-2 rounded-full font-bold text-lg">
                  Search Plot
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mx-auto mb-4 text-[#3C5A3E]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-[#3C5A3E] mb-3">Find Your Plot</h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Enter the <span className="font-bold">exact</span> plot number to locate it on the layout.
                </p>
                <form onSubmit={handlePlotSearch} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={plotSearch}
                      onChange={handleSearchInputChange}
                      placeholder="Enter exact plot number..."
                      className="w-full p-4 pl-12 border-2 border-[#3C5A3E] rounded-md bg-white focus:outline-none focus:ring-4 focus:ring-[#3C5A3E]/30 focus:border-[#3C5A3E] text-lg font-medium"
                      autoFocus
                    />
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6 absolute top-4 left-3 text-[#3C5A3E]" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#3C5A3E] text-white rounded-md hover:bg-[#2d4330] transition-colors text-lg font-medium"
                  >
                    Search
                  </button>
                </form>
              </div>
            )}
            
            {/* Search result notification */}
            {searchQuery.trim() !== "" && (
              <div className="absolute top-4 right-4 z-20">
                <div className={`px-4 py-2 rounded-lg shadow-md ${
                  foundPlots.length > 0 ? 'bg-[#E8EFE8] text-[#3C5A3E]' : 'bg-red-100 text-red-700'
                }`}>
                  {foundPlots.length > 0 ? (
                    <span>
                      Found <strong>{foundPlots.length}</strong> plot{foundPlots.length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span>No plots found for "{searchQuery}"</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Use a fixed position for the image container */}
            <div className="absolute inset-0 z-0">
            {selectedLayout.image && (
              <div className="relative w-full h-full">
                <Image
                  src={selectedLayout.image}
                  alt={selectedLayout.name}
                  fill
                  style={{ objectFit: 'contain' }}
                    priority={true}
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEggI73Jt/8QAAAABJRU5ErkJggg=="
                    onLoadingComplete={(img) => {
                      // Update dimensions when image is loaded by Next.js Image component
                      // but do NOT update the SVG viewBox to prevent plot relocation
                      const newDimensions = { width: img.naturalWidth, height: img.naturalHeight };
                      setImageSize(newDimensions);
                      imageDimensionsCache.current[selectedLayout.id] = newDimensions;
                      setIsImageLoading(false);
                    }}
                />
              </div>
            )}
            </div>
            
            {/* Fixed overlay for SVG plots that won't move */}
            <svg
              className="absolute top-0 left-0 w-full h-full z-10"
              viewBox={svgViewBox}
              preserveAspectRatio="xMidYMid meet"
              style={{ pointerEvents: 'auto' }}
            >
              <defs>
                <filter id="hover-shadow">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
                </filter>
              </defs>
              
              {/* Only render plots that match the search or when hovering */}
              {selectedLayout.Plot.map((plot) => {
                // Only show plots if they match the search or are hovered
                const shouldShowPlot = 
                  (searchQuery.trim() === "" && hoveredPlotId === plot.id) || // Show hovered plot even with no search
                  (foundPlots.some(p => p.id === plot.id)); // Show if plot matches search
                
                if (!shouldShowPlot) return null;
                
                // Calculate center point for the plot (for arrow placement)
                const calculateCenter = () => {
                  if (plot.coordinates && Array.isArray(plot.coordinates) && plot.coordinates.length > 0) {
                    const x = plot.coordinates.reduce((sum, p) => sum + p.x, 0) / plot.coordinates.length;
                    const y = plot.coordinates.reduce((sum, p) => sum + p.y, 0) / plot.coordinates.length;
                    return { x, y };
                  }
                  return null;
                };
                
                const centerPoint = calculateCenter();
                
                return (
                <g key={plot.id}>
                  {plot.coordinates && Array.isArray(plot.coordinates) && plot.coordinates.length > 0 ? (
                    <>
                        {/* Add arrow pointer for found plots */}
                        {foundPlots.some(p => p.id === plot.id) && centerPoint && (
                          <g className="arrow-bounce">
                            {/* Black triangle marker completely outside the plot boundary */}
                            <polygon 
                              points={`${centerPoint.x - 15},${centerPoint.y - 70} ${centerPoint.x},${centerPoint.y - 45} ${centerPoint.x + 15},${centerPoint.y - 70}`}
                              fill="#000000"
                              stroke="#000000"
                              strokeWidth="1.5"
                              style={{
                                filter: "drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.5))"
                              }}
                            />
                          </g>
                        )}
                        
                      <polygon
                        points={plot.coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={
                          plot.status === "sold"
                            ? hoveredPlotId === plot.id ? "rgba(255, 0, 0, 0.4)" : "rgba(255, 0, 0, 0.2)"
                            : plot.status === "reserved"
                            ? hoveredPlotId === plot.id ? "rgba(255, 165, 0, 0.4)" : "rgba(255, 165, 0, 0.2)"
                              : hoveredPlotId === plot.id ? "rgba(0, 166, 81, 0.4)" : "rgba(0, 166, 81, 0.2)" // More standard green
                        }
                        stroke={
                          plot.status === "sold"
                            ? "#ff0000"
                            : plot.status === "reserved"
                            ? "#ffa500"
                              : "#00a651" // More standard green
                        }
                          strokeWidth={foundPlots.some(p => p.id === plot.id) ? "3" : hoveredPlotId === plot.id ? "2" : "1"}
                        style={{
                          cursor: 'pointer',
                            filter: hoveredPlotId === plot.id || foundPlots.some(p => p.id === plot.id) ? 'url(#hover-shadow)' : 'none',
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
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="p-6">
            {/* Show search prompt if no search is entered */}
            {searchQuery.trim() === "" ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg border-2 border-[#3C5A3E] relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#3C5A3E] text-white px-6 py-2 rounded-full font-bold text-lg">
                    Search Plot
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-16 w-16 mx-auto mb-6 text-[#3C5A3E]" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-[#3C5A3E] mb-3">Search for a Plot</h2>
                  <p className="text-gray-600 mb-6 text-lg">
                    Enter the <span className="font-bold">exact</span> plot number to view its details
                  </p>
                  <form onSubmit={handlePlotSearch} className="space-y-4">
                    <div className="relative w-full max-w-md mx-auto">
                      <input
                        type="text"
                        value={plotSearch}
                        onChange={handleSearchInputChange}
                        placeholder="Enter exact plot number..."
                        className="w-full p-4 pl-12 border-2 border-[#3C5A3E] rounded-md bg-white focus:outline-none focus:ring-4 focus:ring-[#3C5A3E]/30 focus:border-[#3C5A3E] text-lg font-medium"
                        autoFocus
                      />
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6 absolute top-4 left-3 text-[#3C5A3E]" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      type="submit"
                      className="w-full max-w-md mx-auto py-3 px-4 bg-[#3C5A3E] text-white rounded-md hover:bg-[#2d4330] transition-colors text-lg font-medium flex items-center justify-center"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Plot
                    </button>
                  </form>
                </div>
              </div>
            ) : foundPlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mb-6 text-red-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-medium text-gray-700 mb-3">No Plots Found</h2>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  No plots matching "{searchQuery}" were found
                </p>
                <button 
                  onClick={clearSearch}
                  className="px-4 py-2 bg-[#3C5A3E] text-white rounded-md hover:bg-[#2d4330] transition-colors"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {/* Display found plots */}
                {foundPlots.map((plot) => (
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
        )}
      </div>
    </div>
  );
}

