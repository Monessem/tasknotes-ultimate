import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function parseTodo(raw: Record<string, unknown>) {
  return {
    ...raw,
    tags: safeJsonParse(raw.tags as string, []),
    subtasks: safeJsonParse(raw.subtasks as string, []),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    completedAt: raw.completedAt ? String(raw.completedAt) : null,
    deletedAt: raw.deletedAt ? String(raw.deletedAt) : null,
    dueDate: raw.dueDate ? String(raw.dueDate) : null,
    recurring: raw.recurring ? String(raw.recurring) : null,
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
    const todo = await db.todo.findUnique({ where: { id } });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(parseTodo(todo));
  } catch (error) {
    console.error('Failed to fetch todo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todo' },
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

    const existing = await db.todo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.completed !== undefined) data.completed = body.completed;
    if (body.flagged !== undefined) data.flagged = body.flagged;
    if (body.important !== undefined) data.important = body.important;
    if (body.recurring !== undefined) data.recurring = body.recurring;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate;
    if (body.folderId !== undefined) data.folderId = body.folderId;
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
    if (body.subtasks !== undefined) data.subtasks = JSON.stringify(body.subtasks);
    if (body.completedAt !== undefined) data.completedAt = body.completedAt;
    if (body.deletedAt !== undefined) data.deletedAt = body.deletedAt;

    const todo = await db.todo.update({
      where: { id },
      data,
    });

    return NextResponse.json(parseTodo(todo));
  } catch (error) {
    console.error('Failed to update todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    const existing = await db.todo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    if (permanent) {
      // Hard delete - permanently remove from database
      await db.todo.delete({ where: { id } });
      return NextResponse.json({ success: true, id });
    }

    // Soft delete - mark as deleted
    const todo = await db.todo.update({
      where: { id },
      data: { deletedAt: new Date().toISOString() },
    });

    return NextResponse.json(parseTodo(todo));
  } catch (error) {
    console.error('Failed to delete todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
