import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function parseNote(raw: Record<string, unknown>) {
  return {
    ...raw,
    checklist: safeJsonParse(raw.checklist as string, []),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    deletedAt: raw.deletedAt ? String(raw.deletedAt) : null,
    folderId: raw.folderId ? String(raw.folderId) : null,
  };
}

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('deleted') === 'true';

    const where = showDeleted ? {} : { deletedAt: null };

    const notes = await db.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes.map(parseNote));
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate title
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    if (body.title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    const note = await db.note.create({
      data: {
        title: body.title,
        content: body.content ?? '',
        color: body.color ?? '#6366f1',
        isPinned: body.isPinned ?? false,
        flagged: body.flagged ?? false,
        folderId: body.folderId ?? null,
        checklist: JSON.stringify(body.checklist ?? []),
        deletedAt: body.deletedAt ?? null,
      },
    });

    return NextResponse.json(parseNote(note), { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
