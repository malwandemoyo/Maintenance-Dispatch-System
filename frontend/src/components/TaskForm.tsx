'use client';

import { useState } from 'react';

interface TaskFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    priority: string;
    property?: number;
    assigned_to?: number;
  }) => Promise<void>;
  isLoading?: boolean;
  properties?: Array<{ id: number; name: string }>;
  staff?: Array<{ id: number; first_name: string; last_name: string; username: string; email: string }>;
  hidePriority?: boolean;
  selectedProperty?: number | string;
  onPropertyChange?: (value: string) => void;
}

export function TaskForm({ onSubmit, isLoading = false, properties = [], staff = [], hidePriority = false, selectedProperty, onPropertyChange }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    property: properties[0]?.id || '',
    assigned_to: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      await onSubmit({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        property: formData.property ? parseInt(formData.property as string) : undefined,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to as string) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Task Title *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
          placeholder="Enter task description"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!hidePriority && (
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        )}

        {properties.length > 0 && (
          <div>
            <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-2">
              Property
            </label>
            <select
              id="property"
              value={selectedProperty ?? formData.property}
              onChange={(e) => {
                setFormData({ ...formData, property: e.target.value });
                if (onPropertyChange) onPropertyChange(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select property...</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {staff.length > 0 && (
        <div>
          <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
            Assign to staff member
          </label>
          <select
            id="assigned_to"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
          >
            <option value="">Leave unassigned</option>
            {staff.map((member) => {
              const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
              const label = fullName || member.username || member.email;

              return (
                <option key={member.id} value={member.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        {isLoading ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
}
