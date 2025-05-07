"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Home } from "lucide-react"
import { useJobCache } from "@/lib/hooks/use-job-cache"

export default function ChatHeader() {
  const { clearAllJobs } = useJobCache()

  const handleHomeClick = () => {
    clearAllJobs()
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={handleHomeClick}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Home className="h-4 w-4" />
            SieveTube Chat
          </Link>

          <Link href="/" onClick={handleHomeClick}>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-3 w-3" />
              New Video
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
} 