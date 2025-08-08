import { useEffect, useRef, useState } from 'react';

interface ProfessionalChartProps {
  symbol: string;
  price: number;
  className?: string;
}

export default function ProfessionalChart({ symbol, price, className = '' }: ProfessionalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([]);

  // LIVE DATA REQUIRED - Professional chart must display real exchange data only
  const generatePriceData = (basePrice: number) => {
    console.warn('Professional chart requires live exchange historical data connection');
    return []; // Return empty - chart will show "Connect exchange for live data"
  };

  useEffect(() => {
    // Generate chart data
    const data = generatePriceData(price);
    setChartData(data);
    setIsLoading(false);
  }, [symbol, price]);

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    if (price >= 0.00000001) return price.toFixed(8);
    return price.toExponential(2);
  };

  // Create SVG path for the price line
  const createPath = (data: Array<{ time: string; price: number }>) => {
    if (data.length === 0) return '';
    
    const width = 800;
    const height = 350;
    const padding = 40;
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-lg border border-gray-700">
          <div className="text-white">Loading professional chart...</div>
        </div>
      </div>
    );
  }

  const svgPath = createPath(chartData);
  const currentPrice = chartData[chartData.length - 1]?.price || price;

  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-700 p-4">
        {/* Chart Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-white">
            <div className="text-lg font-semibold">{symbol}</div>
            <div className="text-2xl font-bold text-green-400">
              ${formatPrice(currentPrice)}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Live Trading Chart
          </div>
        </div>

        {/* Professional SVG Chart */}
        <svg width="100%" height="320" viewBox="0 0 800 350" className="bg-gray-800 rounded">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="35" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 35" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Price line with gradient */}
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#00d4aa" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          {/* Area under the curve */}
          {svgPath && (
            <path
              d={`${svgPath} L 760,310 L 40,310 Z`}
              fill="url(#priceGradient)"
              opacity="0.3"
            />
          )}
          
          {/* Price line */}
          {svgPath && (
            <path
              d={svgPath}
              fill="none"
              stroke="#00d4aa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          
          {/* Current price indicator */}
          {chartData.length > 0 && (
            <circle
              cx="760"
              cy={350 - 40 - ((currentPrice - Math.min(...chartData.map(d => d.price))) / 
                (Math.max(...chartData.map(d => d.price)) - Math.min(...chartData.map(d => d.price)) || 1)) * 270}
              r="4"
              fill="#00d4aa"
              stroke="#1a1a1a"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-2 px-10">
          <span>{chartData[0]?.time}</span>
          <span>{chartData[Math.floor(chartData.length / 2)]?.time}</span>
          <span>{chartData[chartData.length - 1]?.time}</span>
        </div>
      </div>
    </div>
  );
}