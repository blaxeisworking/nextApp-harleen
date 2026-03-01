'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-krea-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-krea-text-primary mb-4">Error</h1>
        <p className="text-krea-text-muted mb-4">{error.message}</p>
        <Button onClick={() => reset()} className="bg-krea-primary">
          Try Again
        </Button>
      </div>
    </div>
  )
}