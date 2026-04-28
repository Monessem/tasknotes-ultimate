import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const habits = await db.habit.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      habits.map((h) => ({
        ...h,
        createdAt: String(h.createdAt),
        deletedAt: h.deletedAt ? String(h.deletedAt) : null,
        reminderTime: h.reminderTime ? String(h.reminderTime) : null,
      }))
    );
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const habit = await db.habit.create({
      data: {
        name: body.name,
        icon: body.icon ?? '🎯',
        color: body.color ?? '#6366f1',
        frequency: body.frequency ?? 'daily',
        reminderTime: body.reminderTime ?? null,
        goal: body.goal ?? 30,
        notes: body.notes ?? '',
      },
    });

    return NextResponse.json(
      {
        ...habit,
        createdAt: String(habit.createdAt),
        deletedAt: habit.deletedAt ? String(habit.deletedAt) : null,
        reminderTime: habit.reminderTime ? String(habit.reminderTime) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create habit:', error);
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}
