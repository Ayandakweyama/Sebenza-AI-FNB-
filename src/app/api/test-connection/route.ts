import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    
    return NextResponse.json({
      status: 'success',
      databases: dbs.databases.map(db => db.name)
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to MongoDB', error: error.message },
      { status: 500 }
    );
  }
}
