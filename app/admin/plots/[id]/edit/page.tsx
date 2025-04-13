"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PenTool,
  Move,
  ZoomIn,
  ZoomOut,
  Save,
  Upload,
  Trash2,
  Check,
  X,
  Undo,
  Trash,
  MousePointer,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { use } from 'react';

interface Point {
  x: number;
  y: number;
}

interface PlotImage {
  url: string;
  caption?: string;
}

interface Plot {
  points: Point[];
  plotNumber: string;
  size: string;
  plotAddress: string;
  price: string;
  dimensions: string;
  facing: string;
  status: string;
  id?: string;
  images: PlotImage[];
  coordinates?: Point[]; // For compatibility with API response
}

interface Layout {
  id: string;
  name: string;
  image: string;
  Plot: any[];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditLayout({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [layoutName, setLayoutName] = useState("");
  const [selectedTool, setSelectedTool] = useState<"pen" | "move" | "select" | "details">("select");
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawingComplete, setIsDrawingComplete] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<Point[][]>([]);
  const [showCompletionHint, setShowCompletionHint] = useState(false);
  const [hintPosition, setHintPosition] = useState<Point | null>(null);
  const [temporaryPolygon, setTemporaryPolygon] = useState<Point[] | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);

  // Stabilize the draw function dependencies to prevent unwanted re-renders
  const stableDependencies = JSON.stringify({
    plotsLength: plots.length,
    pointsLength: currentPoints.length,
    zoom,
    panX: pan.x,
    panY: pan.y,
    hasImage: !!layoutImage,
    selectedPlotId: selectedPlot?.id
  });

  // Redraw the canvas only when important values change
  useEffect(() => {
    drawCanvas();
  }, [stableDependencies]); // This replaces the previous dependency array

  // Additional useEffect to ensure plot points stability
  useEffect(() => {
    // Deep copy the plots to ensure coordinate stability
    if (plots.length > 0) {
      const stabilizedPlots = plots.map(plot => {
        // Ensure we have stable references to prevent unwanted mutations
        return {
          ...plot,
          points: plot.points ? JSON.parse(JSON.stringify(plot.points)) : []
        };
      });
      
      // Only update state if there are differences to avoid render loops
      const currentPlotsStr = JSON.stringify(plots);
      const newPlotsStr = JSON.stringify(stabilizedPlots);
      
      if (currentPlotsStr !== newPlotsStr) {
        setPlots(stabilizedPlots);
      }
    }
  }, []); // Run only once after initial load

  // Ensure canvas size and context are set up correctly
  useEffect(() => {
    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Make sure we have the exact pixel ratio
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Reset transform and scale to ensure we start clean
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Initial draw
      drawCanvas();
    };
    
    initializeCanvas();
  }, []);

  // Fetch the layout data when component mounts
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/layouts/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch layout');
        }
        const layout = await response.json();
        
        // Set layout details
        setLayoutName(layout.name);
        setLayoutImage(layout.image);
        
        // Convert Plot data to format used by editor
        // Important: Correctly transform the coordinates without modifying their positions
        const formattedPlots = layout.Plot.map((plot: any) => {
          // Ensure we're getting the coordinates exactly as stored in the database without transformation
          const coordinates = Array.isArray(plot.coordinates) ? plot.coordinates : [];
          
          // Check if images is a JSON string, and if so, parse it
          let parsedImages = [];
          if (plot.images) {
            try {
              if (typeof plot.images === 'string') {
                parsedImages = JSON.parse(plot.images);
              } else {
                parsedImages = plot.images;
              }
            } catch (e) {
              parsedImages = [];
            }
          }
          
          return {
            id: plot.id,
            points: [...coordinates], // Create a new array to avoid reference issues
            plotNumber: plot.plotNumber || "",
            size: plot.size || "",
            plotAddress: plot.plotAddress || "",
            price: plot.price?.toString() || "",
            dimensions: plot.dimensions || "",
            facing: plot.facing || "North",
            status: plot.status || "available",
            images: parsedImages || []
          };
        });
        
        setPlots(formattedPlots);
        toast.success("Layout loaded successfully");
      } catch (error) {
        console.error('Error fetching layout:', error);
        toast.error("Failed to load layout");
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [id]);

  // Ensure coordinates are preserved and not modified after loading
  // Replace the existing coordinates fix effect with this improved version
  useEffect(() => {
    if (plots.length > 0) {
      // Create a stable copy of the plots array to prevent unwanted re-rendering
      const updatedPlots = plots.map(plot => {
        // If coordinates exist but points are missing or empty, assign coordinates to points
        if (plot.coordinates && plot.coordinates.length > 0 && (!plot.points || plot.points.length === 0)) {
          return {
            ...plot,
            points: [...plot.coordinates] // Create a new array to avoid reference issues
          };
        }
        return plot;
      });
      
      // Only update the state if there's a difference to prevent render loops
      if (JSON.stringify(updatedPlots) !== JSON.stringify(plots)) {
        setPlots(updatedPlots);
      }
    }
  }, [plots]);

  // Setup canvas size on load and resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const displayWidth = container.clientWidth;
        const displayHeight = Math.min(800, window.innerHeight * 0.6);
        
        // Set the display size
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        
        // Set the internal canvas size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        // Adjust the context scale for high DPI displays
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
        
        // Redraw the canvas
        drawCanvas();
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = document.createElement('img');
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setLayoutImage(img.src);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPlotsAndPoints = (ctx: CanvasRenderingContext2D, scale: number, offsetX: number, offsetY: number) => {
    // Draw existing plots with precise coordinates
    plots.forEach((plot) => {
      if (plot.points && plot.points.length > 1) {
        ctx.beginPath();
        const firstPoint = plot.points[0];
        const canvasX = firstPoint.x * scale + offsetX;
        const canvasY = firstPoint.y * scale + offsetY;
        ctx.moveTo(canvasX, canvasY);
        
        plot.points.forEach((point) => {
          const x = point.x * scale + offsetX;
          const y = point.y * scale + offsetY;
          ctx.lineTo(x, y);
        });
        ctx.closePath();
        
        if (selectedPlot === plot) {
          ctx.fillStyle = "rgba(255, 165, 0, 0.3)";
          ctx.strokeStyle = "#ff8c00";
        } else {
          ctx.fillStyle = "rgba(0, 123, 255, 0.2)";
          ctx.strokeStyle = "#007bff";
        }
        ctx.lineWidth = 2 / zoom;
        ctx.fill();
        ctx.stroke();
        
        if (plot.plotNumber) {
          // Calculate the true center of the polygon for the label
          const centerX = plot.points.reduce((sum, point) => sum + point.x, 0) / plot.points.length * scale + offsetX;
          const centerY = plot.points.reduce((sum, point) => sum + point.y, 0) / plot.points.length * scale + offsetY;
          
          ctx.fillStyle = "#000";
          ctx.font = `${14 / zoom}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(plot.plotNumber, centerX, centerY);
        }
      }
    });
    
    // Draw current points being created
    if (currentPoints.length > 0) {
      ctx.beginPath();
      const firstPoint = currentPoints[0];
      const canvasX = firstPoint.x * scale + offsetX;
      const canvasY = firstPoint.y * scale + offsetY;
      ctx.moveTo(canvasX, canvasY);
      
      currentPoints.forEach((point) => {
        const x = point.x * scale + offsetX;
        const y = point.y * scale + offsetY;
        ctx.lineTo(x, y);
      });
      
      if (showCompletionHint && hintPosition) {
        const hintX = hintPosition.x * scale + offsetX;
        const hintY = hintPosition.y * scale + offsetY;
        ctx.lineTo(hintX, hintY);
        ctx.lineTo(canvasX, canvasY);
      }
      
      ctx.strokeStyle = "#ff4081";
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      
      // Draw points as small circles
      currentPoints.forEach((point) => {
        const x = point.x * scale + offsetX;
        const y = point.y * scale + offsetY;
        ctx.beginPath();
        ctx.arc(x, y, 4 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4081";
        ctx.fill();
      });
      
      // Draw hint for completion
      if (showCompletionHint && hintPosition) {
        const x = hintPosition.x * scale + offsetX;
        const y = hintPosition.y * scale + offsetY;
        ctx.beginPath();
        ctx.arc(x, y, 8 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 64, 129, 0.3)";
        ctx.fill();
        ctx.strokeStyle = "#ff4081";
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      }
    }
    
    // Draw temporary polygon for details tool hover
    if (temporaryPolygon && temporaryPolygon.length > 2) {
      ctx.beginPath();
      const firstPoint = temporaryPolygon[0];
      const canvasX = firstPoint.x * scale + offsetX;
      const canvasY = firstPoint.y * scale + offsetY;
      ctx.moveTo(canvasX, canvasY);
      
      temporaryPolygon.forEach(point => {
        const x = point.x * scale + offsetX;
        const y = point.y * scale + offsetY;
        ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2 / zoom;
      ctx.fill();
      ctx.stroke();
    }
  };

  const renderCanvasContent = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    // Clear and set background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scaling factors to fit image in canvas
    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate dimensions to maintain aspect ratio
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    
    // Center the image
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;
    
    // Save context state
    ctx.save();
    
    // Apply zoom and pan transformations
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);
    ctx.translate(-centerX + pan.x / zoom, -centerY + pan.y / zoom);
    
    // Draw the image
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    
    // Draw plots and points
    ctx.save();
    renderPlotsAndPoints(ctx, scale, offsetX, offsetY);
    ctx.restore();
    
    // Restore context state
    ctx.restore();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    if (layoutImage) {
      const img = new window.Image();
      img.src = layoutImage;
      
      if (img.complete) {
        renderCanvasContent(ctx, canvas, img);
      } else {
        img.onload = () => {
          renderCanvasContent(ctx, canvas, img);
        };
      }
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderPlotsAndPoints(ctx, 1, pan.x, pan.y);
    }
  };

  const screenToWorld = (screenX: number, screenY: number, canvas: HTMLCanvasElement): Point => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = screenX * scaleX;
    const canvasY = screenY * scaleY;
    
    // Get the center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate image scaling factors
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    
    if (layoutImage) {
      const img = new window.Image();
      img.src = layoutImage;
      
      if (img.complete && img.naturalWidth > 0) {
        // Calculate scaling factors to fit image in canvas
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        if (imgAspect > canvasAspect) {
          // Image is wider than canvas proportionally
          const drawWidth = canvas.width;
          const drawHeight = canvas.width / imgAspect;
          scale = drawWidth / img.naturalWidth;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller than canvas proportionally
          const drawHeight = canvas.height;
          const drawWidth = canvas.height * imgAspect;
          scale = drawHeight / img.naturalHeight;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        }
      }
    }
    
    // Undo the zoom and pan transformations
    const worldX = ((canvasX - centerX) / zoom + centerX - pan.x / zoom - offsetX) / scale;
    const worldY = ((canvasY - centerY) / zoom + centerY - pan.y / zoom - offsetY) / scale;
    
    return { x: worldX, y: worldY };
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== "pen" && selectedTool !== "details") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Get the mouse position in canvas coordinates
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Convert to world coordinates
    const worldPos = screenToWorld(canvasX, canvasY, canvas);

    if (selectedTool === "pen") {
      // Check if we're closing the polygon by clicking near the first point
      if (
        currentPoints.length >= 3 &&
        isPointCloseToAnother(worldPos, currentPoints[0], 15 / zoom)
      ) {
        // Complete the polygon by adding the first point again
        if (currentPoints.length === 0) {
          setDrawingHistory([]);
        } else {
          setDrawingHistory([...drawingHistory, [...currentPoints]]);
        }
        
        setCurrentPoints([...currentPoints, { ...currentPoints[0] }]);
        setIsDrawingComplete(true);
        setShowCompletionHint(false);
        setHintPosition(null);
        setIsDialogOpen(true);
        return;
      }

      if (currentPoints.length === 0) {
        setDrawingHistory([]);
      } else {
        setDrawingHistory([...drawingHistory, [...currentPoints]]);
      }
      
      setCurrentPoints([...currentPoints, worldPos]);
    } else if (selectedTool === "details") {
      // Find if we clicked inside any polygon
      for (const plot of plots) {
        if (isPointInPolygon(worldPos, plot.points)) {
          setSelectedPlot(plot);
          setIsDialogOpen(true);
          return;
        }
      }
    }
  };
  
  const isPointCloseToAnother = (p1: Point, p2: Point, threshold: number) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === "move") {
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    } else if (selectedTool === "select") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      
      // Get the mouse position in canvas coordinates
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      
      // Convert to world coordinates using the same logic as handleCanvasClick
      const { x, y } = screenToWorld(canvasX, canvasY, canvas);
      
      let foundPlot = false;
      for (const plot of plots) {
        if (isPointInPolygon({ x, y }, plot.points)) {
          setSelectedPlot(plot);
          foundPlot = true;
          break;
        }
      }
      
      if (!foundPlot) {
        setSelectedPlot(null);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const worldPos = screenToWorld(canvasX, canvasY, canvas);
    
    if (isDragging && dragStart) {
      // Calculate the new pan position
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      
      // Update the drag start position
      setDragStart({ x: event.clientX, y: event.clientY });
      
      // Update the pan position
      setPan(prevPan => ({
        x: prevPan.x + dx,
        y: prevPan.y + dy
      }));
    } else if (selectedTool === "pen" && currentPoints.length >= 3) {
      // Check if we're near the first point to show completion hint
      const isNearFirstPoint = isPointCloseToAnother(
        worldPos, 
        currentPoints[0], 
        15 / zoom
      );
      
      setShowCompletionHint(isNearFirstPoint);
      setHintPosition(worldPos);
    } else if (selectedTool === "details") {
      // Highlight polygon under cursor
      let foundPolygon = false;
      for (const plot of plots) {
        if (isPointInPolygon(worldPos, plot.points)) {
          setTemporaryPolygon(plot.points);
          foundPolygon = true;
          break;
        }
      }
      
      if (!foundPolygon) {
        setTemporaryPolygon(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };
  
  const isPointInPolygon = (point: Point, polygon: Point[]) => {
    if (!polygon || polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      // Exact algorithm for point-in-polygon test
      const intersect =
        ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handlePlotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const plotNumber = formData.get("plotNumber") as string;
    const facing = formData.get("facing") as string;
    const status = formData.get("status") as string;
    const price = formData.get("price") as string;
    const size = formData.get("size") as string;
    const plotAddress = formData.get("plotAddress") as string;
    const dimensions = formData.get("dimensions") as string;
    const imageFiles = formData.getAll("plotImages") as File[];
    const imageCaptions = formData.getAll("imageCaptions[]") as string[];
    
    try {
      // Only process images if files are selected
      let processedImages: PlotImage[] = [];
      
      if (imageFiles.length > 0 && imageFiles[0].size > 0) {
        // Convert all images to base64 instead of uploading to server
        const imageProcessingPromises = imageFiles.map(async (file, index) => {
          // Convert file to base64
          const base64String = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve(base64);
            };
            reader.readAsDataURL(file);
          });
          
          return {
            url: base64String,
            caption: imageCaptions[index] || undefined
          };
        });
        
        processedImages = await Promise.all(imageProcessingPromises);
      }

      // For editing existing plot
      if (selectedTool === "details" && selectedPlot) {
        // Create a copy of the plots array
        const updatedPlots = plots.map(plot => {
          if (plot === selectedPlot) {
            const updatedPlot = {
              ...plot,
              plotNumber,
              facing,
              status,
              price,
              size,
              plotAddress,
              dimensions,
              // Ensure images array exists before spreading
              images: [...(plot.images || []), ...processedImages]
            };
            return updatedPlot;
          }
          return plot;
        });
        
        setPlots(updatedPlots);
        // Update selectedPlot to reflect the changes
        const updatedSelectedPlot = updatedPlots.find(p => p === selectedPlot);
        if (updatedSelectedPlot) {
          setSelectedPlot(updatedSelectedPlot);
        }
        setIsDialogOpen(false);
        toast.success("Plot updated successfully!");
        return;
      }
      
      // For creating new plot
      if (isDrawingComplete && currentPoints.length >= 3) {
        const newPlot: Plot = {
          points: currentPoints,
          plotNumber,
          facing,
          status,
          price,
          size,
          plotAddress,
          dimensions,
          images: processedImages
        };
        
        setPlots([...plots, newPlot]);
        setIsDialogOpen(false);
        setCurrentPoints([]);
        setIsDrawingComplete(false);
        toast.success("Plot created successfully!");
      }
    } catch (error) {
      console.error("Error handling plot submission:", error);
      toast.error("Failed to save plot details");
    }
  };

  // Function to update layout in the database
  const handleUpdateLayout = async () => {
    if (!layoutImage || plots.length === 0 || !layoutName) {
      toast.error("Please ensure the layout has an image, name, and at least one plot");
      return;
    }

    try {
      // Prepare plot data for API, ensuring coordinates are preserved exactly
      const plotsData = plots.map(plot => {
        return {
          id: plot.id, // Include ID for existing plots
          // Use exact coordinates without any transformations
          points: plot.points.map(point => ({
            x: point.x,
            y: point.y
          })),
          plotNumber: plot.plotNumber,
          facing: plot.facing,
          status: plot.status,
          price: plot.price,
          size: plot.size,
          plotAddress: plot.plotAddress,
          dimensions: plot.dimensions,
          images: plot.images || [] // Ensure images array is included
        };
      });
      
      const requestBody = {
        name: layoutName,
        image: layoutImage,
        plots: plotsData,
      };
      
      const response = await fetch(`/api/layouts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to update layout:", errorData);
        throw new Error("Failed to update layout: " + (errorData.message || "Unknown error"));
      }

      toast.success("Layout updated successfully!");
      router.push("/admin/plots");
    } catch (error) {
      console.error("Error updating layout:", error);
      toast.error("Failed to update layout: " + (error as Error).message);
    }
  };
  
  const handleCompletePlot = () => {
    if (currentPoints.length < 3) {
      toast.error("Please draw at least 3 points to create a plot");
      return;
    }
    
    setIsDrawingComplete(true);
    setIsDialogOpen(true);
  };
  
  const handleCancelPlot = () => {
    setCurrentPoints([]);
    setIsDrawingComplete(false);
  };
  
  const handleDeleteSelectedPlot = async () => {
    if (selectedPlot) {
      try {
        // If the plot has an ID, it's stored in the database and needs to be deleted from there
        if (selectedPlot.id) {
          const response = await fetch(`/api/plots?id=${selectedPlot.id}`, {
            method: "DELETE",
          });
          
          if (!response.ok) {
            throw new Error("Failed to delete plot from database");
          }
          
          toast.success("Plot deleted from database");
        }
        
        // Remove from local state
        setPlots(plots.filter(plot => plot !== selectedPlot));
        setSelectedPlot(null);
        toast.success("Plot deleted");
      } catch (error) {
        console.error("Error deleting plot:", error);
        toast.error("Failed to delete plot from database");
      }
    }
  };
  
  const handleUndoLastPoint = () => {
    if (currentPoints.length > 0) {
      const newPoints = [...currentPoints];
      newPoints.pop();
      setCurrentPoints(newPoints);
    } else if (drawingHistory.length > 0) {
      const lastState = drawingHistory[drawingHistory.length - 1];
      setCurrentPoints(lastState);
      setDrawingHistory(drawingHistory.slice(0, -1));
    }
  };
  
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.2, 10));
  };
  
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom / 1.2, 0.1));
  };
  
  const handleMouseWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    // Only prevent default to stop page scrolling
    event.preventDefault();
    
    // Mouse wheel zoom functionality is disabled
    // Zoom can only be performed using the Zoom In and Zoom Out buttons
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Layout: {layoutName}</h1>
        <div className="flex gap-4">
          <Button 
            variant="default"
            className="flex items-center gap-2 bg-slate-800"
            onClick={handleUpdateLayout}
          >
            <Save className="h-4 w-4" />
            Save Layout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-9 border rounded-md shadow-sm overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="w-full h-full overflow-hidden">
              <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                className="border border-gray-200 w-full h-auto max-w-full"
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleMouseWheel}
              />
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {currentPoints.length > 0 && (
                <>
                  <Button 
                    variant="default" 
                    className="bg-slate-800 text-white"
                    onClick={handleCompletePlot}
                    disabled={currentPoints.length < 3}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Complete Plot
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleCancelPlot}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-slate-300"
                    onClick={handleUndoLastPoint}
                    disabled={currentPoints.length === 0}
                  >
                    <Undo className="mr-2 h-4 w-4" />
                    Undo
                  </Button>
                </>
              )}
              
              {selectedPlot && (
                <Button 
                  variant="destructive" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteSelectedPlot}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Plot
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          <Card className="border rounded-md shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Layout Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="layoutName">Layout Name</Label>
                  <Input 
                    id="layoutName" 
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    placeholder="Enter layout name" 
                    className="border-slate-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border rounded-md shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button
                  variant={selectedTool === "pen" ? "default" : "outline"}
                  className={`w-full justify-start ${selectedTool === "pen" ? "bg-slate-800 text-white" : "border-slate-300"}`}
                  onClick={() => setSelectedTool("pen")}
                >
                  <PenTool className="mr-2 h-4 w-4" />
                  Pen Tool
                </Button>

                <Button
                  variant={selectedTool === "select" ? "default" : "outline"}
                  className={`w-full justify-start ${selectedTool === "select" ? "bg-slate-800 text-white" : "border-slate-300"}`}
                  onClick={() => setSelectedTool("select")}
                >
                  <MousePointer className="mr-2 h-4 w-4" />
                  Select Tool
                </Button>

                <Button
                  variant={selectedTool === "details" ? "default" : "outline"}
                  className={`w-full justify-start ${selectedTool === "details" ? "bg-slate-800 text-white" : "border-slate-300"}`}
                  onClick={() => setSelectedTool("details")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Add Details
                </Button>

                <Button
                  variant={selectedTool === "move" ? "default" : "outline"}
                  className={`w-full justify-start ${selectedTool === "move" ? "bg-slate-800 text-white" : "border-slate-300"}`}
                  onClick={() => setSelectedTool("move")}
                >
                  <Move className="mr-2 h-4 w-4" />
                  Move Tool
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start border-slate-300"
                  onClick={() => handleZoomIn()}
                >
                  <ZoomIn className="mr-2 h-4 w-4" />
                  Zoom In
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start border-slate-300"
                  onClick={() => handleZoomOut()}
                >
                  <ZoomOut className="mr-2 h-4 w-4" />
                  Zoom Out
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-300"
                  onClick={handleUndoLastPoint}
                  disabled={currentPoints.length === 0}
                >
                  <Undo className="mr-2 h-4 w-4" />
                  Undo
                </Button>

                {selectedPlot && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteSelectedPlot}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Plot
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {selectedPlot && (
            <Card className="border rounded-md shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Selected Plot: {selectedPlot.plotNumber}</CardTitle>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 h-8 w-8 p-0"
                  onClick={handleDeleteSelectedPlot}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Size:</span> {selectedPlot.size}</p>
                  <p><span className="font-semibold">Price:</span> ₹{selectedPlot.price}</p>
                  <p><span className="font-semibold">Status:</span> {selectedPlot.status.charAt(0).toUpperCase() + selectedPlot.status.slice(1)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Plot details dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTool === "details" && selectedPlot
                ? `Edit Plot: ${selectedPlot.plotNumber}`
                : "Add New Plot"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePlotSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plotNumber">Plot Number</Label>
              <Input
                id="plotNumber"
                name="plotNumber"
                className="border-slate-300"
                defaultValue={selectedTool === "details" && selectedPlot ? selectedPlot.plotNumber : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                name="size"
                className="border-slate-300"
                defaultValue={selectedTool === "details" && selectedPlot ? selectedPlot.size : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                className="border-slate-300"
                defaultValue={selectedTool === "details" && selectedPlot ? selectedPlot.price : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plotAddress">Plot Address</Label>
              <Input
                id="plotAddress"
                name="plotAddress"
                className="border-slate-300"
                defaultValue={selectedTool === "details" && selectedPlot ? selectedPlot.plotAddress : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                name="dimensions"
                className="border-slate-300"
                defaultValue={selectedTool === "details" && selectedPlot ? selectedPlot.dimensions : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facing">Facing</Label>
              <Select 
                name="facing" 
                defaultValue={selectedTool === "details" && selectedPlot ? selectedPlot.facing : "North"}
              >
                <SelectTrigger className="w-full border-slate-300">
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North">North</SelectItem>
                  <SelectItem value="South">South</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                  <SelectItem value="North East">North East</SelectItem>
                  <SelectItem value="North West">North West</SelectItem>
                  <SelectItem value="South East">South East</SelectItem>
                  <SelectItem value="South West">South West</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                name="status" 
                defaultValue={selectedTool === "details" && selectedPlot ? selectedPlot.status : "available"}
              >
                <SelectTrigger className="w-full border-slate-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plotImages">Plot Images</Label>
              <div className="space-y-4">
                {selectedPlot?.images?.map((image, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative w-20 h-20">
                      <Image
                        src={image.url}
                        alt={image.caption || `Plot image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <Input
                      name="imageCaptions[]"
                      defaultValue={image.caption}
                      placeholder="Image caption"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={() => {
                        if (selectedPlot) {
                          const updatedImages = [...selectedPlot.images];
                          updatedImages.splice(index, 1);
                          setSelectedPlot({ ...selectedPlot, images: updatedImages });
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <Input
                    id="plotImages"
                    name="plotImages"
                    type="file"
                    accept="image/*"
                    multiple
                    className="flex-1"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" size="icon" variant="ghost">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload plot images</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  if (isDrawingComplete) {
                    setCurrentPoints([]);
                    setIsDrawingComplete(false);
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 