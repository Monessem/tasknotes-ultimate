import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const folder = await db.folder.findUnique({ where: { id } });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Failed to fetch folder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
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

    const existing = await db.folder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.color !== undefined) data.color = body.color;
    if (body.icon !== undefined) data.icon = body.icon;

    const folder = await db.folder.update({
      where: { id },
      data,
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Failed to update folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
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

    const existing = await db.folder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Hard delete - also need to unset folderId on related todos and notes
    await db.todo.updateMany({ where: { folderId: id }, data: { folderId: null } });
    await db.note.updateMany({ where: { folderId: id }, data: { folderId: null } });

    await db.folder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
