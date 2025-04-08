export default function LayoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F5]">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative w-32 h-32">
          <div className="absolute top-0 left-0 w-full h-full border-8 border-[#3C5A3E]/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-8 border-t-[#3C5A3E] rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <svg className="w-12 h-12 text-[#3C5A3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-[#3C5A3E]">Loading Layout</h2>
        <p className="text-gray-500 max-w-md text-center">
          Preparing the layout visualization for you...
        </p>
        
        <div className="w-64 bg-gray-200 rounded-full h-2">
          <div className="bg-[#3C5A3E] h-2 rounded-full w-1/2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
} 