'use client';

import { useState, useEffect } from 'react';

interface Task {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

export default function TestDBPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Test database connection
  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect to database');
      }
      
      setConnectionResult(data);
      fetchTasks(); // Load tasks after successful connection
    } catch (err) {
      setError(err.message);
      console.error('Error testing connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Add a new task
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) throw new Error('Failed to add task');
      
      setNewTask({ title: '', description: '' });
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle task completion
  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) throw new Error('Failed to update task');
      
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Set up editing a task
  const startEditing = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
    });
  };

  // Update a task
  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !newTask.title.trim()) return;

    try {
      const response = await fetch(`/api/tasks?id=${editingTask._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to update task');
      
      setEditingTask(null);
      setNewTask({ title: '', description: '' });
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTask(null);
    setNewTask({ title: '', description: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Connection Test Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">MongoDB Connection Test</h1>
          
          <button
            onClick={testConnection}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error:</p>
              <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {connectionResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h2 className="text-lg font-semibold">Connection Successful! 🎉</h2>
              <p className="text-sm text-gray-600 mt-2">
                Connected to MongoDB Atlas. You can now manage tasks below.
              </p>
            </div>
          )}
        </div>

        {/* Task Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Task Management</h2>
          
          {/* Task Form */}
          <form onSubmit={editingTask ? updateTask : addTask} className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            
            <div className="mb-3">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Task title"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={2}
                placeholder="Task description (optional)"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
              
              {editingTask && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Task List */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Tasks ({tasks.length})</h3>
            
            {tasks.length === 0 ? (
              <p className="text-gray-500 italic">No tasks yet. Add one above!</p>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li 
                    key={task._id}
                    className={`p-4 border rounded-md ${
                      task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => toggleTask(task._id, e.target.checked)}
                        className="mt-1 mr-3"
                      />
                      
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                        }`}>
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {task.description}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {new Date(task.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(task)}
                          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                          disabled={task.completed}
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
