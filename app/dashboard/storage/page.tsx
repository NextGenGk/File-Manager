import { FileExplorer } from '@/components/file-explorer'

export default function StoragePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-2xl font-bold">Storage</h1>
      <FileExplorer />
    </div>
  )
}
