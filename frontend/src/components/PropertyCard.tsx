'use client';

interface PropertyCardProps {
  id: number;
  name: string;
  address: string;
  unitCount?: number;
  managerName?: string;
  onClick?: () => void;
}

export function PropertyCard({
  name,
  address,
  unitCount,
  managerName,
  onClick,
}: PropertyCardProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500 mt-1">{address}</p>
        </div>
        <div className="bg-green-100 text-green-800 p-2 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
        {unitCount !== undefined && (
          <div className="text-gray-600">
            <span className="font-semibold">{unitCount}</span> Units
          </div>
        )}
        {managerName && (
          <div className="text-gray-600">
            Manager: <span className="font-semibold">{managerName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
