import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import * as fileService from '@/lib/file-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storageInfo = await fileService.getUserStorageInfo(userId)
    if (!storageInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(storageInfo)
  } catch (error) {
    console.error('Error in GET /api/storage:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve storage information' },
      { status: 500 }
    )
  }
}
