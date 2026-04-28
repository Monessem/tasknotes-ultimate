import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const folders = await db.folder.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const folder = await db.folder.create({
      data: {
        name: body.name,
        color: body.color ?? '#6366f1',
        icon: body.icon ?? '📁',
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Failed to create folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
