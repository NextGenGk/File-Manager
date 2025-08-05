import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { Folder } from 'lucide-react'

interface NewFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFolderCreated?: (folder: any) => void
  currentPath?: string
}

export function NewFolderDialog({ 
  open, 
  onOpenChange, 
  onFolderCreated,
  currentPath = ''
}: NewFolderDialogProps) {
  const [folderName, setFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!folderName.trim()) {
      toast({
        title: 'Folder name required',
        description: 'Please enter a name for the folder',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)

    try {
      const formData = new FormData()
      formData.append('name', folderName)
      formData.append('path', currentPath)
      formData.append('isFolder', 'true')

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create folder')
      }

      const data = await response.json()

      toast({
        title: 'Folder Created',
        description: `${folderName} has been created successfully.`,
      })

      setFolderName('')
      onOpenChange(false)

      if (onFolderCreated) {
        onFolderCreated(data.folder)
      }
    } catch (error) {
      console.error('Create folder error:', error)
      toast({
        title: 'Create Folder Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Create New Folder
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="folderName"
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
