import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const entries = await db.historyEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      entries.map((e) => ({
        ...e,
        createdAt: String(e.createdAt),
      }))
    );
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entry = await db.historyEntry.create({
      data: {
        action: body.action,
        itemType: body.itemType,
        itemId: body.itemId,
        itemTitle: body.itemTitle,
      },
    });

    return NextResponse.json(
      {
        ...entry,
        createdAt: String(entry.createdAt),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create history entry:', error);
    return NextResponse.json(
      { error: 'Failed to create history entry' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await db.historyEntry.deleteMany();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear history:', error);
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }
}
