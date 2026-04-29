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

    // Validate habitId
    if (typeof habitId !== 'string' || habitId.trim().length === 0) {
      return NextResponse.json(
        { error: 'habitId is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof date !== 'string' || !dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format' },
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
