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
        weatherApiKey: '',
        webhookUrl: '',
        colorTheme: 'emerald',
        fontSize: 'medium',
        autoStartPomodoro: false,
        longBreakInterval: 4,
        reminderTime: 'morning',
        displayName: '',
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

    // Validate pomodoroWork
    if (body.pomodoroWork !== undefined) {
      if (typeof body.pomodoroWork !== 'number' || body.pomodoroWork < 1 || body.pomodoroWork > 60) {
        return NextResponse.json(
          { error: 'pomodoroWork must be a number between 1 and 60' },
          { status: 400 }
        );
      }
    }

    // Validate pomodoroShortBreak
    if (body.pomodoroShortBreak !== undefined) {
      if (typeof body.pomodoroShortBreak !== 'number' || body.pomodoroShortBreak < 1 || body.pomodoroShortBreak > 30) {
        return NextResponse.json(
          { error: 'pomodoroShortBreak must be a number between 1 and 30' },
          { status: 400 }
        );
      }
    }

    // Validate pomodoroLongBreak
    if (body.pomodoroLongBreak !== undefined) {
      if (typeof body.pomodoroLongBreak !== 'number' || body.pomodoroLongBreak < 1 || body.pomodoroLongBreak > 60) {
        return NextResponse.json(
          { error: 'pomodoroLongBreak must be a number between 1 and 60' },
          { status: 400 }
        );
      }
    }

    // Validate language
    if (body.language !== undefined) {
      const validLanguages = ['en', 'ar'];
      if (!validLanguages.includes(body.language)) {
        return NextResponse.json(
          { error: 'Language must be one of: en, ar' },
          { status: 400 }
        );
      }
    }

    // Validate colorTheme
    if (body.colorTheme !== undefined) {
      const validThemes = ['emerald', 'ocean', 'sunset'];
      if (!validThemes.includes(body.colorTheme)) {
        return NextResponse.json(
          { error: 'colorTheme must be one of: emerald, ocean, sunset' },
          { status: 400 }
        );
      }
    }

    // Validate fontSize
    if (body.fontSize !== undefined) {
      const validFontSizes = ['small', 'medium', 'large'];
      if (!validFontSizes.includes(body.fontSize)) {
        return NextResponse.json(
          { error: 'fontSize must be one of: small, medium, large' },
          { status: 400 }
        );
      }
    }

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
        ...(body.privacyMode !== undefined && { privacyMode: body.privacyMode }),
        ...(body.pomodoroEnabled !== undefined && { pomodoroEnabled: body.pomodoroEnabled }),
        ...(body.achievementsEnabled !== undefined && { achievementsEnabled: body.achievementsEnabled }),
        ...(body.weeklyReportEnabled !== undefined && { weeklyReportEnabled: body.weeklyReportEnabled }),
        ...(body.weatherApiKey !== undefined && { weatherApiKey: body.weatherApiKey }),
        ...(body.webhookUrl !== undefined && { webhookUrl: body.webhookUrl }),
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
        privacyMode: body.privacyMode ?? false,
        pomodoroEnabled: body.pomodoroEnabled ?? true,
        achievementsEnabled: body.achievementsEnabled ?? true,
        weeklyReportEnabled: body.weeklyReportEnabled ?? true,
        weatherApiKey: body.weatherApiKey ?? '',
        webhookUrl: body.webhookUrl ?? '',
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
