import { useState, useEffect, useCallback } from 'react'
import { UploadButton } from '@/components/ui/upload-button'
import { NewFolderDialog } from '@/components/ui/new-folder-dialog'
import { Button } from '@/components/ui/button'
import {
  FolderPlus,
  Folder,
  File,
  Trash,
  RefreshCw,
  ArrowLeft,
  MoreVertical,
  Pencil
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { formatBytes } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface FileItem {
  id: string
  name: string
  path: string
  size: number
  is_folder: boolean
  created_at: string
  updated_at: string
}

interface FileExplorerProps {
  onFileSelect?: (file: FileItem) => void
}

export function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('')
  const [pathHistory, setPathHistory] = useState<string[]>([])
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null)

  const fetchFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`)

      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }

      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPath])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleNavigateToFolder = (folder: FileItem) => {
    setPathHistory([...pathHistory, currentPath])
    setCurrentPath(folder.path)
  }

  const handleNavigateBack = () => {
    const previousPath = pathHistory.pop() || ''
    setPathHistory([...pathHistory])
    setCurrentPath(previousPath)
  }

  const handleRefresh = () => {
    fetchFiles()
  }

  const handleFileUploadComplete = () => {
    fetchFiles()
  }

  const handleFolderCreated = () => {
    fetchFiles()
  }

  const handleOpenRenameDialog = (file: FileItem) => {
    setFileToRename(file)
    setNewFileName(file.name)
    setRenameDialogOpen(true)
  }

  const handleRename = async () => {
    if (!fileToRename || !newFileName.trim()) {
      return
    }

    try {
      const response = await fetch(`/api/files/${fileToRename.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'rename',
          name: newFileName,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to rename file')
      }

      toast({
        title: 'Success',
        description: 'File renamed successfully',
      })

      setRenameDialogOpen(false)
      fetchFiles()
    } catch (error) {
      console.error('Error renaming file:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to rename file',
        variant: 'destructive',
      })
    }
  }

  const handleOpenDeleteDialog = (file: FileItem) => {
    setFileToDelete(file)
    setConfirmDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!fileToDelete) {
      return
    }

    try {
      const response = await fetch(`/api/files/${fileToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete file')
      }

      toast({
        title: 'Success',
        description: `${fileToDelete.is_folder ? 'Folder' : 'File'} deleted successfully`,
      })

      setConfirmDeleteDialogOpen(false)
      fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleNavigateBack}
            disabled={pathHistory.length === 0}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            {currentPath || 'Root'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setNewFolderDialogOpen(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <UploadButton 
            onUploadComplete={handleFileUploadComplete} 
            currentPath={currentPath}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <div className="mb-2">No files found</div>
          <div className="text-sm">Upload a file or create a folder to get started</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex flex-col items-center justify-between rounded-lg border p-3 hover:bg-accent"
            >
              <div 
                className="flex w-full cursor-pointer items-center gap-2"
                onClick={() => file.is_folder ? handleNavigateToFolder(file) : onFileSelect?.(file)}
              >
                {file.is_folder ? (
                  <Folder className="h-8 w-8 text-blue-500" />
                ) : (
                  <File className="h-8 w-8 text-gray-500" />
                )}
                <div className="flex-1 truncate">
                  <div className="truncate font-medium">{file.name}</div>
                  {!file.is_folder && (
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex w-full justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenRenameDialog(file)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenDeleteDialog(file)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onFolderCreated={handleFolderCreated}
        currentPath={currentPath}
      />

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Rename {fileToRename?.is_folder ? 'Folder' : 'File'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="newFileName"
                placeholder="New name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete {fileToDelete?.name}?</p>
            {fileToDelete?.is_folder && (
              <p className="mt-2 text-sm text-destructive">
                Only empty folders can be deleted. If this folder contains files, the operation will fail.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
