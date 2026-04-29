import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const habit = await db.habit.findUnique({ where: { id } });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...habit,
      createdAt: String(habit.createdAt),
      deletedAt: habit.deletedAt ? String(habit.deletedAt) : null,
      reminderTime: habit.reminderTime ? String(habit.reminderTime) : null,
    });
  } catch (error) {
    console.error('Failed to fetch habit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
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

    const existing = await db.habit.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.color !== undefined) data.color = body.color;
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.reminderTime !== undefined) data.reminderTime = body.reminderTime;
    if (body.goal !== undefined) data.goal = body.goal;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.deletedAt !== undefined) data.deletedAt = body.deletedAt;

    const habit = await db.habit.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...habit,
      createdAt: String(habit.createdAt),
      deletedAt: habit.deletedAt ? String(habit.deletedAt) : null,
      reminderTime: habit.reminderTime ? String(habit.reminderTime) : null,
    });
  } catch (error) {
    console.error('Failed to update habit:', error);
    return NextResponse.json(
      { error: 'Failed to update habit' },
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

    const existing = await db.habit.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const habit = await db.habit.update({
      where: { id },
      data: { deletedAt: new Date().toISOString() },
    });

    return NextResponse.json({
      ...habit,
      createdAt: String(habit.createdAt),
      deletedAt: habit.deletedAt ? String(habit.deletedAt) : null,
      reminderTime: habit.reminderTime ? String(habit.reminderTime) : null,
    });
  } catch (error) {
    console.error('Failed to delete habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}
