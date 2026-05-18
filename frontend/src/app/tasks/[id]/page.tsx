"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { api } from "~/trpc/react";
import Link from "next/link";

function formatStaffName(member?: {
  first_name?: string;
  last_name?: string;
  username?: string;
}) {
  if (!member) return "Unassigned";

  const fullName = [member.first_name, member.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || member.username || "Unassigned";
}

function formatCommentAuthor(
  comment: {
    author_details?: {
      username?: string;
      first_name?: string;
      last_name?: string;
      role?: string;
    };
    author_name?: string;
    isCurrentUser?: boolean;
  },
  fallback = "You",
) {
  const firstName = comment.isCurrentUser
    ? "You"
    : comment.author_details?.first_name || comment.author_name || fallback;
  const roleValue = String(
    comment.author_details?.role || "user",
  ).toLowerCase();
  const role = roleValue.includes("manager") ? "property manager" : roleValue;

  return `${firstName} - ${role}`;
}

function formatCommentTimestamp(value?: string) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = parseInt(params.id as string);
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [comment, setComment] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [assignedStaffLabel, setAssignedStaffLabel] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [activeAction, setActiveAction] = useState<
    "progress" | "completed" | null
  >(null);
  const [optimisticComments, setOptimisticComments] = useState<any[]>([]);

  const { data: currentUser } = api.users.getCurrentUser.useQuery();
  const { data: task, isLoading } = api.tasks.get.useQuery({ id: taskId });
  const { data: comments } = api.comments.list.useQuery({ task_id: taskId });

  // determine property id for this task (could be number or object)
  const propertyId = (() => {
    if (!task) return undefined;
    if (task.property_details?.id) return task.property_details.id;
    if (task.property_id) return task.property_id;
    if (typeof task.property === "number") return task.property;
    if (task.property && typeof task.property === "object")
      return task.property.id;
    return undefined;
  })();

  // only fetch maintenance staff for managers and when a property id is available
  const { data: staff, error: staffError } =
    api.users.getMaintenanceStaff.useQuery(
      { page: 1, limit: 100, propertyId },
      { enabled: !!propertyId && session?.user?.role === "manager" },
    );

  const assignMutation = api.tasks.assign.useMutation();
  const updateStatusMutation = api.tasks.markInProgress.useMutation();
  const completeMutation = api.tasks.markCompleted.useMutation();
  const commentMutation = api.comments.create.useMutation();
  const deleteMutation = api.tasks.delete.useMutation();

  const maintenanceStaff = Array.isArray(staff)
    ? staff
    : (staff?.results ?? []);
  const selectedStaff = maintenanceStaff.find(
    (member: any) => String(member.id) === selectedStaffId,
  );
  const assignedToLabel =
    assignedStaffLabel ||
    formatStaffName(task?.assigned_to_details) ||
    task?.assigned_to_name ||
    "Unassigned";
  const propertyLabel =
    task?.property_details?.name ||
    task?.property_name ||
    (typeof task?.property === "object" ? task?.property?.name : undefined) ||
    "Unknown";
  const displayComments = [
    ...optimisticComments,
    ...(comments?.results ?? []),
  ].filter(
    (entry, index, all) =>
      index ===
      all.findIndex((candidate) => String(candidate.id) === String(entry.id)),
  );
  const currentUserIdentifier =
    currentUser?.username || currentUser?.email || session?.user?.name || "";

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    try {
      const updatedTask = await assignMutation.mutateAsync({
        task_id: taskId,
        staff_id: parseInt(selectedStaffId),
      });
      const staffLabel =
        formatStaffName(updatedTask?.assigned_to_details) ||
        formatStaffName(selectedStaff) ||
        "Assigned";
      setAssignedStaffLabel(staffLabel);
      await utils.tasks.get.invalidate({ id: taskId });
      await utils.tasks.list.invalidate();
      await utils.users.getMaintenanceStaff.invalidate();
      setAssignmentMessage("Task assigned successfully");
      setSelectedStaffId("");
    } catch (error) {
      console.error("Failed to assign task:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: taskId });
      await utils.tasks.list.invalidate();
      window.location.href = "/tasks";
      setAssignmentMessage("Task deleted successfully");
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleStatusUpdate = async (action: "progress" | "completed") => {
    setActiveAction(action);
    setActionMessage("");

    try {
      if (action === "progress") {
        await updateStatusMutation.mutateAsync({ id: taskId });
        setActionMessage("Work started successfully");
        await utils.tasks.get.invalidate({ id: taskId });
        await utils.tasks.list.invalidate();
      } else {
        await completeMutation.mutateAsync({ id: taskId });
        await utils.tasks.get.invalidate({ id: taskId });
        await utils.tasks.list.invalidate();
        router.push("/tasks");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      setActionMessage(
        action === "progress"
          ? "Could not start work"
          : "Could not complete task",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      task: taskId,
      content: comment.trim(),
      created_at: new Date().toISOString(),
      author_name: currentUser?.first_name || session?.user?.name || "You",
      author_details: {
        username: currentUser?.username || session?.user?.name || "You",
        first_name: currentUser?.first_name || session?.user?.name || "You",
        last_name: "",
        role: String(
          currentUser?.role || session?.user?.role || "user",
        ).toLowerCase(),
      },
      isCurrentUser: true,
      optimistic: true,
    };

    setOptimisticComments((current) => [optimisticComment, ...current]);
    setComment("");

    try {
      const createdComment = await commentMutation.mutateAsync({
        task_id: taskId,
        content: optimisticComment.content,
      });
      setOptimisticComments((current) =>
        current.map((entry) => (entry.id === tempId ? createdComment : entry)),
      );
      await utils.comments.list.invalidate({ task_id: taskId });
    } catch (error) {
      setOptimisticComments((current) =>
        current.filter((entry) => entry.id !== tempId),
      );
      setComment(optimisticComment.content);
      console.error("Failed to post comment:", error);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">Task not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/tasks" className="text-blue-600 hover:text-blue-700">
                ← Back to Tasks
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <div className="w-20"></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Task Details */}
            <div className="lg:col-span-2">
              <div className="mb-6 rounded-lg bg-white p-6 shadow">
                <div className="mb-6">
                  <h2 className="mb-2 text-lg font-semibold text-gray-900">
                    Description
                  </h2>
                  <p className="text-gray-700">
                    {task.description || "No description"}
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {task.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {task.priority}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {propertyLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned to</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {assignedToLabel}
                    </p>
                  </div>
                </div>

                {/* Status Actions */}
                {session?.user?.role === "maintenance_staff" &&
                  task.status !== "completed" && (
                    <div className="space-y-3">
                      {actionMessage && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                          {actionMessage}
                        </div>
                      )}

                      {task.status === "assigned" && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                          <p className="mb-3 text-sm font-medium text-blue-900">
                            Ready to begin?
                          </p>
                          <p className="mb-4 text-sm text-blue-800">
                            Start work to move this task into progress and let
                            the team know you’ve begun.
                          </p>
                          <button
                            onClick={() => handleStatusUpdate("progress")}
                            disabled={
                              activeAction === "progress" ||
                              updateStatusMutation.isPending
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            {activeAction === "progress" ||
                            updateStatusMutation.isPending
                              ? "Starting…"
                              : "Start Work"}
                          </button>
                        </div>
                      )}

                      {task.status === "in_progress" && (
                        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                          <p className="mb-3 text-sm font-medium text-green-900">
                            Work in progress
                          </p>
                          <p className="mb-4 text-sm text-green-800">
                            Once the task is finished, mark it completed to
                            return to the task list.
                          </p>
                          <button
                            onClick={() => handleStatusUpdate("completed")}
                            disabled={
                              activeAction === "completed" ||
                              completeMutation.isPending
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            {activeAction === "completed" ||
                            completeMutation.isPending
                              ? "Completing…"
                              : "Mark Completed"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Discussion Section */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Discussion
                </h2>

                {/* Discussion Form */}
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                    >
                      Post
                    </button>
                  </div>
                </form>

                {/* Discussion List */}
                <div className="space-y-4">
                  {displayComments.length > 0 ? (
                    displayComments.map((c: any) => (
                      <div
                        key={c.id}
                        className={`rounded-lg border-l-4 p-4 ${
                          c.isCurrentUser
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-gray-50"
                        }`}
                      >
                        <p
                          className={`font-semibold ${c.isCurrentUser ? "text-blue-900" : "text-gray-900"}`}
                        >
                          {formatCommentAuthor(
                            {
                              ...c,
                              isCurrentUser:
                                !!currentUserIdentifier &&
                                ((c.author_details?.username &&
                                  String(c.author_details.username) ===
                                    String(currentUserIdentifier)) ||
                                  (c.author_name &&
                                    String(c.author_name) ===
                                      String(currentUserIdentifier)) ||
                                  c.isCurrentUser),
                            },
                            currentUser?.first_name ||
                              session?.user?.name ||
                              "You",
                          )}
                          ;{" "}
                          <span
                            className={`font-normal ${c.isCurrentUser ? "text-blue-800" : "text-gray-700"}`}
                          >
                            {c.content}
                          </span>
                        </p>
                        <p
                          className={`text-sm ${c.isCurrentUser ? "text-blue-700" : "text-gray-500"}`}
                        >
                          {formatCommentTimestamp(c.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No comments yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {session?.user?.role === "manager" &&
                task.status === "pending" && (
                  <div className="rounded-lg bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Assign Task
                    </h3>
                    {assignmentMessage && (
                      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        <div className="flex items-center justify-between gap-3">
                          <span>{assignmentMessage}</span>
                          <button
                            type="button"
                            onClick={() => setAssignmentMessage("")}
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    )}
                    {staffError && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        {staffError instanceof Error
                          ? staffError.message
                          : "Could not load maintenance staff."}
                      </div>
                    )}

                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select staff member...</option>
                      {(Array.isArray(staff)
                        ? staff
                        : (staff?.results ?? [])
                      ).map((s: any) => {
                        const fullName = [s.first_name, s.last_name]
                          .filter(Boolean)
                          .join(" ")
                          .trim();
                        const label = fullName || s.username || s.email;

                        return (
                          <option key={s.id} value={s.id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={handleAssign}
                      disabled={!selectedStaffId || assignMutation.isPending}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {assignMutation.isPending ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                )}

              {session?.user?.role === "manager" && (
                <div className="mt-4 rounded-lg bg-white p-6 shadow">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Task"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
