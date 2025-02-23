'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import UndoIcon from '@mui/icons-material/Undo';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateIcon from '@mui/icons-material/Create';
import PanToolIcon from '@mui/icons-material/PanTool';
import GridOnIcon from '@mui/icons-material/GridOn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Tool = 'pen' | 'select' | 'plot-info' | 'none';

interface Point {
  x: number;
  y: number;
}

interface PlotArea {
  points: Point[];
  plotNumber: string;
  details?: PlotDetails;
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

const PlotLayoutEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [plotAreas, setPlotAreas] = useState<PlotArea[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [plotCounter, setPlotCounter] = useState(1);
  const [selectedPoint, setSelectedPoint] = useState<{plotIndex: number, pointIndex: number} | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const pointRadius = 4;
  const [layoutName, setLayoutName] = useState<string>('');
  const [isLayoutNameDialogOpen, setIsLayoutNameDialogOpen] = useState(false);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          if (canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            
            // Set canvas size to match container dimensions
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            
            // Reset zoom and pan when new image is loaded
            setZoom(1);
            setPan({ x: 0, y: 0 });
            
            redrawCanvas();
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate the actual mouse position in canvas coordinates
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    // Adjust for pan and zoom
    return {
      x: (canvasX - pan.x) / zoom,
      y: (canvasY - pan.y) / zoom
    };
  };

  const isNearPoint = (p1: Point, p2: Point, threshold = 5): boolean => {
    // Scale the threshold by zoom to make hit detection consistent at all zoom levels
    const scaledThreshold = threshold / zoom;
    const distance = Math.sqrt(
      Math.pow((p1.x - p2.x), 2) + 
      Math.pow((p1.y - p2.y), 2)
    );
    return distance <= scaledThreshold;
  };

  const findNearestPoint = (point: Point): { index: number, isStart: boolean } | null => {
    for (let i = 0; i < plotAreas.length; i++) {
      const area = plotAreas[i];
      if (isNearPoint(point, area.points[0])) {
        return { index: i, isStart: true };
      }
      if (isNearPoint(point, area.points[area.points.length - 1])) {
        return { index: i, isStart: false };
      }
    }
    return null;
  };

  const handleToolSelect = (tool: Tool) => {
    setCurrentTool(tool);
    setSelectedPoint(null);
    setSelectedPlot(null);
    setCurrentPoints([]);
    setIsDrawing(false);
    redrawCanvas();
  };

  const findClickedPoint = (point: Point): {plotIndex: number, pointIndex: number} | null => {
    for (let i = 0; i < plotAreas.length; i++) {
      const area = plotAreas[i];
      for (let j = 0; j < area.points.length; j++) {
        if (isNearPoint(point, area.points[j])) {
          return { plotIndex: i, pointIndex: j };
        }
      }
    }
    return null;
  };

  const findClickedPlot = (point: Point): number | null => {
    for (let i = 0; i < plotAreas.length; i++) {
      if (isPointInPolygon(point, plotAreas[i].points)) {
        return i;
      }
    }
    return null;
  };

  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
            yi = polygon[i].y,
            xj = polygon[j].x,
            yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) && 
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2 || (currentTool === 'select' && e.button === 0)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const point = getMousePosition(e);

    switch (currentTool) {
      case 'pen':
        handlePenToolDown(point);
        break;
      case 'plot-info':
        handlePlotInfoToolDown(point);
        break;
    }
  };

  const handlePenToolDown = (point: Point) => {
    if (currentPoints.length > 0) {
      const firstPoint = currentPoints[0];
      if (isNearPoint(point, firstPoint)) {
        finishDrawing();
        return;
      }
    }

    const nearestPoint = findNearestPoint(point);
    if (nearestPoint) {
      const existingPlot = plotAreas[nearestPoint.index];
      const connectingPoints = nearestPoint.isStart 
        ? existingPlot.points 
        : [...existingPlot.points].reverse();
      setCurrentPoints(prev => [...prev, ...connectingPoints]);
      return;
    }

    setIsDrawing(true);
    setCurrentPoints(prev => [...prev, point]);
  };

  const handlePlotInfoToolDown = (point: Point) => {
    const plotIndex = findClickedPlot(point);
    if (plotIndex !== null) {
      setSelectedPlot(plotIndex);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      redrawCanvas();
      return;
    }

    const point = getMousePosition(e);

    if (currentTool === 'pen' && isDrawing) {
      redrawCanvas();
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && currentPoints.length > 0) {
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(pan.x / zoom, pan.y / zoom);
        
        ctx.beginPath();
        ctx.moveTo(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
        
        ctx.restore();
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
  };

  const finishDrawing = () => {
    if (currentPoints.length < 3) return;
    
    const plotNumber = `Plot ${plotCounter}`;
    setPlotCounter(prev => prev + 1);
    
    const newPlotArea: PlotArea = {
      points: [...currentPoints],
      plotNumber
    };

    setPlotAreas(prev => [...prev, newPlotArea]);
    setIsDrawing(false);
    setCurrentPoints([]);
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save the context state
    ctx.save();
    
    // Apply zoom and pan transformations
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw background image with proper scaling
    if (backgroundImage) {
      const scale = Math.min(
        canvas.width / backgroundImage.width,
        canvas.height / backgroundImage.height
      );
      const x = (canvas.width / scale - backgroundImage.width) / 2;
      const y = (canvas.height / scale - backgroundImage.height) / 2;
      ctx.drawImage(backgroundImage, x, y);
    }

    // Draw completed plot areas
    plotAreas.forEach((area, index) => {
      const isSelected = index === selectedPlot;
      drawPlotArea(ctx, area, isSelected);
    });

    // Draw current points and lines
    if (currentPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      currentPoints.forEach((point, i) => {
        if (i > 0) ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      currentPoints.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius / zoom, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#00FF00' : '#FF0000';
        ctx.fill();
      });
    }

    // Restore the context state
    ctx.restore();
  };

  const drawPlotArea = (ctx: CanvasRenderingContext2D, area: PlotArea, isSelected: boolean = false) => {
    // Draw plot outline
    ctx.beginPath();
    ctx.moveTo(area.points[0].x, area.points[0].y);
    area.points.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.strokeStyle = isSelected ? '#00FF00' : '#FF0000';
    ctx.lineWidth = (isSelected ? 3 : 2) / zoom;
    ctx.stroke();

    if (isSelected) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.fill();
    }

    // Draw points
    area.points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
    });
    
    // Add plot number label
    const centerX = area.points.reduce((sum, p) => sum + p.x, 0) / area.points.length;
    const centerY = area.points.reduce((sum, p) => sum + p.y, 0) / area.points.length;
    ctx.fillStyle = '#000000';
    ctx.font = `${14 / zoom}px Arial`;
    ctx.fillText(area.plotNumber, centerX, centerY);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(10, prev + delta)));
  };

  const handleUndo = () => {
    if (currentPoints.length > 0) {
      setCurrentPoints(prev => prev.slice(0, -1));
      redrawCanvas();
    }
  };

  const handleDelete = () => {
    if (plotAreas.length > 0) {
      setPlotAreas(prev => prev.slice(0, -1));
      redrawCanvas();
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [zoom, plotAreas]);

  const handleSave = async () => {
    if (!backgroundImage || plotAreas.length === 0) return;
    setIsLayoutNameDialogOpen(true);
  };

  const handleLayoutSave = async () => {
    if (!layoutName.trim()) return;
    
    const layoutData = {
      name: layoutName,
      image: canvasRef.current?.toDataURL(),
      plotAreas: plotAreas.map(area => ({
        plotNumber: area.plotNumber,
        coordinates: area.points,
        details: area.details
      }))
    };

    // TODO: Add API call to save layout
    console.log('Saving layout data:', layoutData);
    setIsLayoutNameDialogOpen(false);
  };

  const [plotDetails, setPlotDetails] = useState<PlotDetails>({
    plotNumber: '',
    siteName: '',
    size: '',
    plotAddress: '',
    price: 0,
    dimensions: '',
    facing: 'North',
    status: 'Available'
  });

  const handleDetailsSubmit = () => {
    if (selectedPlot !== null) {
      const newPlotAreas = [...plotAreas];
      newPlotAreas[selectedPlot].details = plotDetails;
      setPlotAreas(newPlotAreas);
      setIsDetailsDialogOpen(false);
      setSelectedPlot(null);
    }
  };

  // Update the handleContainerWheel function to handle zoom with Ctrl + wheel
  const handleContainerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.ctrlKey) {
      // Zoom with Ctrl + wheel
      const delta = -e.deltaY * 0.01;
      setZoom(prev => Math.max(0.1, Math.min(10, prev + delta)));
    } else {
      // Regular scrolling - update pan position
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
    redrawCanvas();
  };

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Plot Layout Editor</h1>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {!backgroundImage ? (
            // Show only upload button and existing layouts when no image is loaded
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <input
                  accept="image/*"
                  type="file"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="layout-image-upload"
                />
                <label htmlFor="layout-image-upload">
                  <Button asChild>
                    <span>Upload Layout Image</span>
                  </Button>
                </label>
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Existing Layouts</h2>
                {/* TODO: Add list of existing layouts */}
              </div>
            </div>
          ) : (
            // Show editor interface when image is loaded
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleToolSelect('pen')}
                  className={currentTool === 'pen' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <CreateIcon className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleToolSelect('select')}
                  className={currentTool === 'select' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <PanToolIcon className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleToolSelect('plot-info')}
                  className={currentTool === 'plot-info' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <GridOnIcon className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="icon" onClick={() => handleZoom(0.1)}>
                  <AddIcon className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="icon" onClick={() => handleZoom(-0.1)}>
                  <RemoveIcon className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="icon" onClick={handleUndo}>
                  <UndoIcon className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="icon" onClick={handleDelete}>
                  <DeleteIcon className="h-4 w-4" />
                </Button>

                <span className="text-sm text-muted-foreground">
                  Zoom: {(zoom * 100).toFixed(0)}%
                </span>
              </div>

              <div className="text-sm text-muted-foreground mb-2">
                Selected Tool: {
                  currentTool === 'pen' ? 'Draw Plot (Pen)' :
                  currentTool === 'select' ? 'Select & Move' :
                  currentTool === 'plot-info' ? 'Plot Information' :
                  'None'
                }
              </div>

              <div 
                ref={containerRef}
                onWheel={handleContainerWheel}
                className="border rounded-md overflow-hidden relative h-[70vh]"
                style={{ 
                  cursor: isDragging ? 'grabbing' : 
                         currentTool === 'pen' ? 'crosshair' :
                         currentTool === 'select' ? 'move' :
                         currentTool === 'plot-info' ? 'pointer' : 'grab',
                  touchAction: 'none',
                  overscrollBehavior: 'none',
                  WebkitOverflowScrolling: 'touch',
                  isolation: 'isolate'
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e);
                  }}
                  onMouseMove={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseMove(e);
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp(e);
                  }}
                  onMouseLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp(e);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="block w-full h-full object-contain select-none touch-none"
                />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {currentTool === 'pen' && 'Click to place points. Click near the first point to complete the shape.'}
                  {currentTool === 'select' && 'Click and drag points to adjust plot shapes.'}
                  {currentTool === 'plot-info' && 'Click a plot to add or edit its details.'}
                  {currentTool === 'none' && 'Select a tool to begin.'}
                </p>
                <Button
                  onClick={handleSave}
                  disabled={plotAreas.length === 0}
                >
                  Save Layout
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Layout Name Dialog */}
      <Dialog 
        modal={true}
        open={isLayoutNameDialogOpen} 
        onOpenChange={setIsLayoutNameDialogOpen}
      >
        <DialogHeader>
          <DialogTitle>Save Layout</DialogTitle>
          <DialogDescription>
            Enter a name for this layout to save it.
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="layoutName" className="text-right">Layout Name</Label>
              <Input
                id="layoutName"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => setIsLayoutNameDialogOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleLayoutSave} disabled={!layoutName.trim()}>
            Save Layout
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Plot Details Dialog */}
      <Dialog 
        modal={true}
        open={isDetailsDialogOpen} 
        onOpenChange={setIsDetailsDialogOpen}
      >
        <DialogHeader>
          <DialogTitle>Plot Details</DialogTitle>
          <DialogDescription>
            Enter the details for this plot. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <DialogContent className="min-w-[500px]">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plotNumber" className="text-right">Plot Number</Label>
              <Input
                id="plotNumber"
                value={plotDetails.plotNumber}
                onChange={(e) => setPlotDetails(prev => ({ ...prev, plotNumber: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="siteName" className="text-right">Site Name</Label>
              <Input
                id="siteName"
                value={plotDetails.siteName}
                onChange={(e) => setPlotDetails(prev => ({ ...prev, siteName: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="size" className="text-right">Size</Label>
              <Input
                id="size"
                value={plotDetails.size}
                onChange={(e) => setPlotDetails(prev => ({ ...prev, size: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plotAddress" className="text-right">Plot Address</Label>
              <Textarea
                id="plotAddress"
                value={plotDetails.plotAddress}
                onChange={(e) => setPlotDetails(prev => ({ ...prev, plotAddress: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price</Label>
              <Input
                id="price"
                type="number"
                value={plotDetails.price}
                onChange={(e) => setPlotDetails(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dimensions" className="text-right">Dimensions</Label>
              <Input
                id="dimensions"
                value={plotDetails.dimensions}
                onChange={(e) => setPlotDetails(prev => ({ ...prev, dimensions: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="facing" className="text-right">Facing</Label>
              <Select
                value={plotDetails.facing}
                onValueChange={(value) => setPlotDetails(prev => ({ ...prev, facing: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select facing direction" />
                </SelectTrigger>
                <SelectContent>
                  {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West']
                    .map(facing => (
                      <SelectItem key={facing} value={facing}>{facing}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                value={plotDetails.status}
                onValueChange={(value: PlotDetails['status']) => setPlotDetails(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select plot status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="gap-2">
          <Button 
            onClick={() => setIsDetailsDialogOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDetailsSubmit}
          >
            Save Details
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default PlotLayoutEditor; 