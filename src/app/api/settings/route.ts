import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await db.settings.findUnique({
      where: { id: 'app-settings' },
    });

    if (!settings) {
      // Return defaults if no settings exist yet
      return NextResponse.json({
        weatherEnabled: true,
        weatherCity: 'cairo',
        pomodoroWork: 25,
        pomodoroShortBreak: 5,
        pomodoroLongBreak: 15,
        taskReminders: true,
        soundEnabled: true,
        darkMode: false,
        language: 'en',
        autoSync: false,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const settings = await db.settings.upsert({
      where: { id: 'app-settings' },
      update: {
        ...(body.weatherEnabled !== undefined && { weatherEnabled: body.weatherEnabled }),
        ...(body.weatherCity !== undefined && { weatherCity: body.weatherCity }),
        ...(body.pomodoroWork !== undefined && { pomodoroWork: body.pomodoroWork }),
        ...(body.pomodoroShortBreak !== undefined && { pomodoroShortBreak: body.pomodoroShortBreak }),
        ...(body.pomodoroLongBreak !== undefined && { pomodoroLongBreak: body.pomodoroLongBreak }),
        ...(body.taskReminders !== undefined && { taskReminders: body.taskReminders }),
        ...(body.soundEnabled !== undefined && { soundEnabled: body.soundEnabled }),
        ...(body.darkMode !== undefined && { darkMode: body.darkMode }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.autoSync !== undefined && { autoSync: body.autoSync }),
        ...(body.gitHubToken !== undefined && { gitHubToken: body.gitHubToken }),
        ...(body.gistId !== undefined && { gistId: body.gistId }),
        ...(body.colorTheme !== undefined && { colorTheme: body.colorTheme }),
        ...(body.fontSize !== undefined && { fontSize: body.fontSize }),
        ...(body.autoStartPomodoro !== undefined && { autoStartPomodoro: body.autoStartPomodoro }),
        ...(body.longBreakInterval !== undefined && { longBreakInterval: body.longBreakInterval }),
        ...(body.reminderTime !== undefined && { reminderTime: body.reminderTime }),
        ...(body.displayName !== undefined && { displayName: body.displayName }),
      },
      create: {
        id: 'app-settings',
        weatherEnabled: body.weatherEnabled ?? true,
        weatherCity: body.weatherCity ?? 'cairo',
        pomodoroWork: body.pomodoroWork ?? 25,
        pomodoroShortBreak: body.pomodoroShortBreak ?? 5,
        pomodoroLongBreak: body.pomodoroLongBreak ?? 15,
        taskReminders: body.taskReminders ?? true,
        soundEnabled: body.soundEnabled ?? true,
        darkMode: body.darkMode ?? false,
        language: body.language ?? 'en',
        autoSync: body.autoSync ?? false,
        gitHubToken: body.gitHubToken ?? '',
        gistId: body.gistId ?? '',
        colorTheme: body.colorTheme ?? 'emerald',
        fontSize: body.fontSize ?? 'medium',
        autoStartPomodoro: body.autoStartPomodoro ?? false,
        longBreakInterval: body.longBreakInterval ?? 4,
        reminderTime: body.reminderTime ?? 'morning',
        displayName: body.displayName ?? '',
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
