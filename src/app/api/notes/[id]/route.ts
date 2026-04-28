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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await db.note.findUnique({ where: { id } });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(parseNote(note));
  } catch (error) {
    console.error('Failed to fetch note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.color !== undefined) data.color = body.color;
    if (body.isPinned !== undefined) data.isPinned = body.isPinned;
    if (body.flagged !== undefined) data.flagged = body.flagged;
    if (body.folderId !== undefined) data.folderId = body.folderId;
    if (body.checklist !== undefined) data.checklist = JSON.stringify(body.checklist);
    if (body.deletedAt !== undefined) data.deletedAt = body.deletedAt;

    const note = await db.note.update({
      where: { id },
      data,
    });

    return NextResponse.json(parseNote(note));
  } catch (error) {
    console.error('Failed to update note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const note = await db.note.update({
      where: { id },
      data: { deletedAt: new Date().toISOString() },
    });

    return NextResponse.json(parseNote(note));
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
