"use client";

import { useState } from "react";

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface StaffSelectorProps {
  staff: StaffMember[];
  onSelect: (staffId: number) => Promise<void>;
  isLoading?: boolean;
  selectedStaffId?: number;
}

export function StaffSelector({
  staff,
  onSelect,
  isLoading = false,
  selectedStaffId,
}: StaffSelectorProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (staffId: number) => {
    setError("");
    try {
      await onSelect(staffId);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign");
    }
  };

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  return (
    <div className="relative">
      {error && (
        <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading || staff.length === 0}
        className="flex w-full items-center justify-between rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        <span>
          {selectedStaff
            ? `${selectedStaff.first_name} ${selectedStaff.last_name}`
            : "Assign Staff"}
        </span>
        <svg
          className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 left-0 z-10 mt-2 rounded-lg border border-gray-300 bg-white shadow-lg">
          <div className="max-h-48 overflow-y-auto py-2">
            {staff.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member.id)}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 disabled:opacity-50"
              >
                <div className="font-medium text-gray-900">
                  {member.first_name} {member.last_name}
                </div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
