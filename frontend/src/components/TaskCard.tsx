'use client';

import Link from 'next/link';
import { StatusBadge, PriorityBadge } from './Badges';

interface TaskCardProps {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  property?: string;
  assignedToName?: string;
  createdAt?: string;
}

export function TaskCard({
  id,
  title,
  description,
  status,
  priority,
  property,
  assignedToName,
  createdAt,
}: TaskCardProps) {
  return (
    <Link href={`/tasks/${id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">
              {title}
            </h3>
            <div className="flex gap-2 ml-2">
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
            </div>
          </div>

          {description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="space-y-1">
              {property && <p>Property: {property}</p>}
              {assignedToName && <p>Assigned: {assignedToName}</p>}
              {!assignedToName && status === 'pending' && (
                <p className="text-yellow-600 font-medium">Unassigned</p>
              )}
            </div>
            {createdAt && <p className="text-right">{new Date(createdAt).toLocaleDateString()}</p>}
          </div>
        </div>
      </div>
    </Link>
  );
}
