"use client";

import Link from "next/link";
import { StatusBadge, PriorityBadge } from "./Badges";

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
      <div className="cursor-pointer overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg">
        <div className="p-6">
          <div className="mb-3 flex items-start justify-between">
            <h3 className="line-clamp-2 flex-1 text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <div className="ml-2 flex gap-2">
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
            </div>
          </div>

          {description && (
            <p className="mb-4 line-clamp-2 text-sm text-gray-600">
              {description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="space-y-1">
              {property && <p>Property: {property}</p>}
              {assignedToName && <p>Assigned: {assignedToName}</p>}
              {!assignedToName && status === "pending" && (
                <p className="font-medium text-yellow-600">Unassigned</p>
              )}
            </div>
            {createdAt && (
              <p className="text-right">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
