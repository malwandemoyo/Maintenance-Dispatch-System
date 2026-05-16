'use client';

interface Property {
  id: number;
  name: string;
}

interface PropertySelectorProps {
  properties: Property[];
  selectedId: number | null;
  onChange: (id: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PropertySelector({
  properties,
  selectedId,
  onChange,
  isLoading = false,
  disabled = false,
}: PropertySelectorProps) {
  return (
    <div>
      <label htmlFor="property-selector" className="block text-sm font-medium text-gray-700 mb-1">
        Select Property
      </label>
      <select
        id="property-selector"
        value={selectedId || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled || isLoading}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
      >
        <option value="" disabled>
          {isLoading ? 'Loading properties...' : 'Choose a property'}
        </option>
        {properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.name}
          </option>
        ))}
      </select>
    </div>
  );
}
