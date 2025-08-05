import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import * as fileService from '@/lib/file-service'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = resolvedParams.id;
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const success = await fileService.deleteFile(userId, fileId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/files/[id]:', error);

    if (error instanceof Error && error.message === 'Cannot delete non-empty folder') {
      return NextResponse.json(
        { error: 'Cannot delete non-empty folder' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = resolvedParams.id;
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { operation, name, targetFolderId } = body;

    if (operation === 'rename' && name) {
      const file = await fileService.renameFile(userId, fileId, name);
      if (!file) {
        return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
      }
      return NextResponse.json({ file });
    } else if (operation === 'move') {
      const file = await fileService.moveFile(userId, fileId, targetFolderId);
      if (!file) {
        return NextResponse.json({ error: 'Failed to move file' }, { status: 500 });
      }
      return NextResponse.json({ file });
    } else {
      return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Error in PATCH /api/files/[id]:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('not supported')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}
