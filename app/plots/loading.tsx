export default function PlotsLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9F5]">
      <div className="w-24 h-24 relative mb-8">
        <div className="absolute w-full h-full rounded-full border-4 border-[#3C5A3E]/20" />
        <div className="absolute w-full h-full rounded-full border-t-4 border-[#3C5A3E] animate-spin" />
      </div>
      
      <h2 className="text-2xl font-semibold text-[#3C5A3E] mb-3">Loading Plots</h2>
      <p className="text-gray-500 max-w-md text-center mb-6">
        We're preparing the layout data and plots information for you. This may take a moment...
      </p>
      
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-[#3C5A3E] animate-pulse rounded-full" />
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-8">
        <div className="w-4 h-4 rounded-full bg-[#3C5A3E] animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-4 h-4 rounded-full bg-[#3C5A3E] animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-4 h-4 rounded-full bg-[#3C5A3E] animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
} 