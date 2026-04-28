import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habitId');

    const where = habitId ? { habitId } : {};

    const logs = await db.habitLog.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch habit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { habitId, date } = body;

    if (!habitId || !date) {
      return NextResponse.json(
        { error: 'habitId and date are required' },
        { status: 400 }
      );
    }

    // Check if a log already exists for this habitId + date
    const existing = await db.habitLog.findFirst({
      where: { habitId, date },
    });

    if (existing) {
      // Toggle off: delete the existing log
      await db.habitLog.delete({ where: { id: existing.id } });
      return NextResponse.json({ toggled: false, id: existing.id });
    } else {
      // Toggle on: create a new log
      const log = await db.habitLog.create({
        data: { habitId, date, completed: true },
      });
      return NextResponse.json({ toggled: true, log }, { status: 201 });
    }
  } catch (error) {
    console.error('Failed to toggle habit log:', error);
    return NextResponse.json(
      { error: 'Failed to toggle habit log' },
      { status: 500 }
    );
  }
}
