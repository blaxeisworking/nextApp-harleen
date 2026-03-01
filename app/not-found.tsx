export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-krea-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-krea-text-primary mb-4">404</h1>
        <p className="text-krea-text-muted mb-4">Page not found</p>
        <a
          href="/workflows"
          className="text-krea-primary hover:text-krea-primary/80 underline"
        >
          Go to Workflows
        </a>
      </div>
    </div>
  )
}