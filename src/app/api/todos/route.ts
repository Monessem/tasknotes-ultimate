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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('deleted') === 'true';

    const where = showDeleted ? {} : { deletedAt: null };

    const todos = await db.todo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(todos.map(parseTodo));
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
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

    // Validate priority
    const validPriorities = ['high', 'medium', 'low'];
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: 'Priority must be one of: high, medium, low' },
        { status: 400 }
      );
    }

    const todo = await db.todo.create({
      data: {
        title: body.title,
        description: body.description ?? '',
        priority: body.priority ?? 'medium',
        completed: body.completed ?? false,
        flagged: body.flagged ?? false,
        important: body.important ?? false,
        recurring: body.recurring ?? null,
        dueDate: body.dueDate ?? null,
        folderId: body.folderId ?? null,
        tags: JSON.stringify(body.tags ?? []),
        subtasks: JSON.stringify(body.subtasks ?? []),
        completedAt: body.completedAt ?? null,
        deletedAt: body.deletedAt ?? null,
      },
    });

    return NextResponse.json(parseTodo(todo), { status: 201 });
  } catch (error) {
    console.error('Failed to create todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
