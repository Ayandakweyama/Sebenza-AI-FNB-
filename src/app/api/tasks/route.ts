import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Helper to get the tasks collection
async function getTasksCollection() {
  const client = await clientPromise;
  const db = client.db(); // Use the default database from the connection string
  return db.collection('tasks');
}

// GET /api/tasks - Get all tasks
export async function GET() {
  try {
    const tasks = await getTasksCollection();
    const allTasks = await tasks.find({}).toArray();
    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const tasks = await getTasksCollection();
    const result = await tasks.insertOne({
      title,
      description: description || '',
      createdAt: new Date(),
      completed: false
    });

    return NextResponse.json({
      _id: result.insertedId,
      title,
      description: description || '',
      completed: false,
      createdAt: new Date()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a task
// Note: This is a simplified example. In a real app, you'd use dynamic routes
// For now, we'll handle updates via query parameters
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const updates = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const tasks = await getTasksCollection();
    const result = await tasks.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const tasks = await getTasksCollection();
    const result = await tasks.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

// Add ObjectId type for TypeScript
import { ObjectId } from 'mongodb';

declare global {
  interface String {
    toObjectId(): ObjectId;
  }
}

// Add toObjectId method to String prototype for convenience
String.prototype.toObjectId = function() {
  return new ObjectId(this.toString());
};
