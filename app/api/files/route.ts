import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import * as fileService from '@/lib/file-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the path from the query string
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path') || ''

    const files = await fileService.listFiles(userId, path)
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error in GET /api/files:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()

    // Handle folder creation
    const isFolder = formData.get('isFolder') === 'true'
    const path = formData.get('path') as string || ''
    const name = formData.get('name') as string

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (isFolder) {
      const folder = await fileService.createFolder(userId, name, path)
      if (!folder) {
        return NextResponse.json(
          { error: 'Failed to create folder' },
          { status: 500 }
        )
      }
      return NextResponse.json({ folder })
    }

    // Handle file upload
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    const uploadedFile = await fileService.uploadFile(userId, file, path)
    if (!uploadedFile) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    return NextResponse.json({ file: uploadedFile })
  } catch (error: any) {
    console.error('Error in POST /api/files:', error)

    // Check for storage quota exceeded
    if (error.message === 'Storage quota exceeded') {
      return NextResponse.json(
        { error: 'Storage quota exceeded' },
        { status: 413 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
