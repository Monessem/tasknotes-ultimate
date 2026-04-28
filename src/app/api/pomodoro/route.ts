import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const sessions = await db.pomodoroSession.findMany({
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch pomodoro sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pomodoro sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const session = await db.pomodoroSession.create({
      data: {
        date: body.date ?? new Date().toISOString().split('T')[0],
        duration: body.duration ?? 25,
        type: body.type ?? 'work',
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create pomodoro session:', error);
    return NextResponse.json(
      { error: 'Failed to create pomodoro session' },
      { status: 500 }
    );
  }
}
