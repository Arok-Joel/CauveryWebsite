"use client";

import { useState, useRef, useEffect } from "react";
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
}

export default function CreateLayout() {
  const [layoutName, setLayoutName] = useState("");
  const [selectedTool, setSelectedTool] = useState<"pen" | "move" | "select" | "details">("pen");
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

  useEffect(() => {
    drawCanvas();
  }, [currentPoints, plots, zoom, pan, layoutImage, selectedPlot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const displayWidth = container.clientWidth;
        const displayHeight = Math.min(800, window.innerHeight * 0.6);
        
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        
        const dpr = 1;
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
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
    // Draw existing plots
    plots.forEach((plot) => {
      if (plot.points.length > 1) {
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
          const centerX = plot.points.reduce((sum, point) => sum + point.x * scale + offsetX, 0) / plot.points.length;
          const centerY = plot.points.reduce((sum, point) => sum + point.y * scale + offsetY, 0) / plot.points.length;
          
          ctx.fillStyle = "#000";
          ctx.font = `${14 / zoom}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(plot.plotNumber, centerX, centerY);
        }
      }
    });
    
    // Draw current points
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
        ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
        ctx.fill();
      }
      
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      
      if (isDrawingComplete) {
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fill();
      }
      
      currentPoints.forEach((point, index) => {
        ctx.beginPath();
        const x = point.x * scale + offsetX;
        const y = point.y * scale + offsetY;
        
        if (index === 0 && showCompletionHint) {
          ctx.arc(x, y, 5 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = "#00ff00";
        } else {
          ctx.arc(x, y, 3 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = "#ff0000";
        }
        ctx.fill();
      });
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
    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate dimensions to maintain aspect ratio
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    
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
      const img = document.createElement('img');
      img.src = layoutImage;
      
      if (img.complete) {
        renderCanvasContent(ctx, canvas, img);
      } else {
        img.onload = () => {
          renderCanvasContent(ctx, canvas, img);
        };
      }
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate default scale for non-image case
      const scale = 1;
      const offsetX = 0;
      const offsetY = 0;
      
      ctx.save();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX + pan.x / zoom, -centerY + pan.y / zoom);
      
      renderPlotsAndPoints(ctx, scale, offsetX, offsetY);
      ctx.restore();
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
    
    // Calculate scaling factors to fit image in canvas
    const imgScaleX = canvas.width / imageSize.width;
    const imgScaleY = canvas.height / imageSize.height;
    const scale = Math.min(imgScaleX, imgScaleY);
    
    // Calculate image offset in canvas
    const offsetX = (canvas.width - imageSize.width * scale) / 2;
    const offsetY = (canvas.height - imageSize.height * scale) / 2;
    
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
    
    // Debug info
    console.log("Click at canvas position:", canvasX, canvasY);
    console.log("Transformed to world position:", worldPos.x, worldPos.y);
    console.log("Current zoom:", zoom, "pan:", pan);
    console.log("Image size:", imageSize);

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

  const handlePlotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const plotNumber = formData.get("plotNumber") as string;
    const facing = formData.get("facing") as string;
    const status = formData.get("status") as string;
    const imageFiles = formData.getAll("plotImages") as File[];
    const imageCaptions = formData.getAll("imageCaptions[]") as string[];
    
    try {
      // First, upload all images
      const imageUploadPromises = imageFiles.map(async (file, index) => {
        const imageFormData = new FormData();
        imageFormData.append("file", file);
        
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }
        
        const { url } = await uploadResponse.json();
        return {
          url,
          caption: imageCaptions[index] || undefined
        };
      });
      
      const uploadedImages = await Promise.all(imageUploadPromises);

      if (selectedPlot && selectedTool === "details") {
        // Update existing plot
        const updatedPlot: Plot = {
          ...selectedPlot,
          plotNumber: plotNumber || selectedPlot.plotNumber,
          size: formData.get("size") as string || selectedPlot.size,
          plotAddress: formData.get("plotAddress") as string || selectedPlot.plotAddress,
          price: formData.get("price") as string || selectedPlot.price,
          dimensions: formData.get("dimensions") as string || selectedPlot.dimensions,
          facing: facing || selectedPlot.facing,
          status: status || selectedPlot.status,
          images: [...(selectedPlot.images || []), ...uploadedImages]
        };
        
        const response = await fetch("/api/plots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedPlot.id,
            plotNumber: updatedPlot.plotNumber,
            size: updatedPlot.size,
            plotAddress: updatedPlot.plotAddress,
            price: updatedPlot.price,
            dimensions: updatedPlot.dimensions,
            facing: updatedPlot.facing,
            status: updatedPlot.status,
            coordinates: updatedPlot.points,
            images: updatedPlot.images
          }),
        });
        
        if (!response.ok) throw new Error("Failed to save plot details");
        
        setPlots(plots.map(p => p === selectedPlot ? updatedPlot : p));
        setSelectedPlot(null);
        setIsDialogOpen(false);
        toast.success("Plot details saved successfully!");
      } else {
        // Create new plot
        const newPlot: Plot = {
          points: currentPoints,
          plotNumber: plotNumber,
          size: formData.get("size") as string,
          plotAddress: formData.get("plotAddress") as string,
          price: formData.get("price") as string,
          dimensions: formData.get("dimensions") as string,
          facing: facing,
          status: status || "available",
          images: uploadedImages
        };
        
        const response = await fetch("/api/plots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: Math.random().toString(36).substring(2, 9),
            plotNumber: newPlot.plotNumber,
            size: newPlot.size,
            plotAddress: newPlot.plotAddress,
            price: newPlot.price,
            dimensions: newPlot.dimensions,
            facing: newPlot.facing,
            status: newPlot.status,
            coordinates: newPlot.points,
            images: newPlot.images
          }),
        });
        
        if (!response.ok) throw new Error("Failed to save plot details");

        const savedPlot = await response.json();
        setPlots([...plots, { ...newPlot, id: savedPlot.id }]);
        setCurrentPoints([]);
        setIsDrawingComplete(false);
        setIsDialogOpen(false);
        toast.success("Plot details saved successfully!");
      }
    } catch (error) {
      console.error("Error saving plot:", error);
      toast.error("Failed to save plot details");
    }
  };

  const handleSaveLayout = async () => {
    if (!layoutImage || plots.length === 0 || !layoutName) {
      toast.error("Please upload an image, enter a layout name, and create at least one plot");
      return;
    }

    try {
      // Get all plot IDs
      const plotIds = plots.map(plot => plot.id);
      
      const response = await fetch("/api/layouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: layoutName,
          image: layoutImage,
          plotIds: plotIds, // Only send the IDs of plots, not the full plot data
        }),
      });

      if (!response.ok) throw new Error("Failed to save layout");

      toast.success("Layout saved successfully!");
    } catch (error) {
      toast.error("Failed to save layout");
      console.error(error);
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
        // Only attempt to delete from database if the plot has an ID
        if (selectedPlot.id) {
          const response = await fetch(`/api/plots?id=${selectedPlot.id}`, {
            method: "DELETE",
          });
          
          if (!response.ok) {
            throw new Error("Failed to delete plot from database");
          }
        }
        
        // Remove from local state
        setPlots(plots.filter(plot => plot !== selectedPlot));
        setSelectedPlot(null);
        toast.success("Plot deleted successfully!");
      } catch (error) {
        console.error("Error deleting plot:", error);
        toast.error("Failed to delete plot from database");
      }
    }
  };
  
  const handleUndoLastPoint = () => {
    if (currentPoints.length > 0) {
      if (drawingHistory.length > 0) {
        const lastState = drawingHistory[drawingHistory.length - 1];
        setCurrentPoints(lastState);
        setDrawingHistory(drawingHistory.slice(0, -1));
      } else {
        setCurrentPoints([]);
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(prevZoom => {
      const newZoom = prevZoom * 1.2;
      console.log("Zooming in:", prevZoom, "->", Math.min(newZoom, 5));
      return Math.min(newZoom, 5);
    });
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => {
      const newZoom = prevZoom / 1.2;
      console.log("Zooming out:", prevZoom, "->", Math.max(newZoom, 0.2));
      return Math.max(newZoom, 0.2);
    });
  };

  const handleMouseWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    // Get the mouse position relative to the canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate zoom
    const oldZoom = zoom;
    let newZoom = oldZoom;
    
    if (event.deltaY < 0) {
      newZoom = Math.min(oldZoom * 1.2, 5);
    } else {
      newZoom = Math.max(oldZoom / 1.2, 0.2);
    }
    
    // Only proceed if zoom actually changed
    if (newZoom !== oldZoom) {
      // Calculate new pan to zoom toward/away from the mouse position
      const zoomRatio = newZoom / oldZoom;
      
      setPan(prevPan => ({
        x: mouseX - (mouseX - prevPan.x) * zoomRatio,
        y: mouseY - (mouseY - prevPan.y) * zoomRatio
      }));
      
      setZoom(newZoom);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Layout</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => document.getElementById("imageUpload")?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload Layout
          </Button>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button 
            variant="default"
            className="flex items-center gap-2 bg-slate-800"
            onClick={handleSaveLayout}
          >
            <Save className="h-4 w-4" />
            Save Layout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-9 border rounded-md shadow-sm">
          <CardContent className="p-4">
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              className="border border-gray-200 w-full h-auto"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleMouseWheel}
            />
            
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedTool === "details" && selectedPlot ? "Edit Plot Details" : "Enter Plot Details"}</DialogTitle>
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
              <Label htmlFor="price">Price</Label>
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
            <Button type="submit" className="w-full bg-slate-800">
              {selectedTool === "details" && selectedPlot ? "Update Plot" : "Save Plot"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 