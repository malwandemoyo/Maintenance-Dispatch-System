"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { TaskForm } from "~/components/TaskForm";
import { api } from "~/trpc/react";
import { useState } from "react";

export default function NewTaskPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const createTaskMutation = api.tasks.create.useMutation();
  const { data: properties } = api.properties.list.useQuery({
    page: 1,
    limit: 100,
  });
  const [selectedProperty, setSelectedProperty] = useState<number | string>("");

  // fetch maintenance staff only when a property is selected
  const { data: staff, error: staffError } =
    api.users.getMaintenanceStaff.useQuery(
      {
        page: 1,
        limit: 100,
        propertyId: selectedProperty ? Number(selectedProperty) : undefined,
      },
      { enabled: !!selectedProperty },
    );
  const maintenanceStaff = Array.isArray(staff)
    ? staff
    : (staff?.results ?? []);

  const handleSubmit = async (data: {
    title: string;
    description?: string;
    priority: string;
    property?: number;
    assigned_to?: number;
  }) => {
    if (!data.property) {
      throw new Error("Please select a property");
    }

    await createTaskMutation.mutateAsync({
      title: data.title,
      description: data.description,
      priority: data.priority as "low" | "medium" | "high" | "urgent",
      property: data.property,
      assigned_to: data.assigned_to,
    });

    await utils.tasks.list.invalidate();
    router.push("/tasks");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Add Task</h1>
            <TaskForm
              onSubmit={handleSubmit}
              isLoading={createTaskMutation.isPending}
              properties={
                properties?.results?.map((property: any) => ({
                  id: property.id,
                  name: property.name,
                })) ?? []
              }
              staff={maintenanceStaff.map((member: any) => ({
                id: member.id,
                first_name: member.first_name,
                last_name: member.last_name,
                username: member.username,
                email: member.email,
              }))}
              selectedProperty={selectedProperty}
              onPropertyChange={(val) => setSelectedProperty(val)}
            />
            {staffError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                {staffError instanceof Error
                  ? staffError.message
                  : "Could not load maintenance staff for this property."}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
