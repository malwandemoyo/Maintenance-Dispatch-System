"use client";

import { StatusBadge, PriorityBadge } from "./Badges";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  property: string;
  assignedToName?: string;
  assigned_to_details?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    staff_profile?: { role_title?: string } | null;
  } | null;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
}: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
              <h3
                className="text-xl leading-6 font-medium text-gray-900"
                id="modal-title"
              >
                {task.title}
              </h3>

              <div className="mt-4 flex gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Description
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {task.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Property
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {task.property}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Assigned To
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {task.assigned_to_details
                        ? `${task.assigned_to_details.first_name || task.assigned_to_details.username || ""} ${task.assigned_to_details.last_name || ""}` +
                          (task.assigned_to_details.staff_profile?.role_title
                            ? ` - ${task.assigned_to_details.staff_profile.role_title}`
                            : "")
                        : task.assignedToName || "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3 sm:mt-6">
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:col-start-1 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
