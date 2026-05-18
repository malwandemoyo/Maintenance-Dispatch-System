"use client";
import React, { useState } from "react";

export default function ReportActions({ id }: { id: string | number }) {
  const [loading, setLoading] = useState(false);

  async function createTask() {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/api/reports/${id}/create_task/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Follow-up: report ${id}` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert("Failed to create task: " + (data.detail || res.statusText));
      } else {
        alert("Task created from report");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function closeReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/api/reports/${id}/close/`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert("Failed to close report: " + (data.detail || res.statusText));
      } else {
        alert("Report closed");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={createTask}
        disabled={loading}
        style={{ marginRight: 8 }}
      >
        Create Task
      </button>
      <button onClick={closeReport} disabled={loading}>
        Close Report
      </button>
    </div>
  );
}
