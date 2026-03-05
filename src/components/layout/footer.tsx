'use client'

import { Github, Twitter, Linkedin, BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="h-8 bg-krea-surface border-t border-krea-border flex items-center px-4 text-xs text-krea-text-muted">
      <div className="flex items-center gap-4">
        <span>© 2024 NextFlow. All rights reserved.</span>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/your-username/nextflow"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-krea-text-primary transition-colors"
          >
            <Github className="w-3 h-3" />
          </a>
          <a
            href="https://twitter.com/your-handle"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-krea-text-primary transition-colors"
          >
            <Twitter className="w-3 h-3" />
          </a>
          <a
            href="https://linkedin.com/company/your-company"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-krea-text-primary transition-colors"
          >
            <Linkedin className="w-3 h-3" />
          </a>
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <a
          href="/docs"
          className="hover:text-krea-text-primary transition-colors flex items-center gap-1"
        >
          <BookOpen className="w-3 h-3" />
          <span>Documentation</span>
        </a>
        <span>•</span>
        <span>v1.0.0</span>
      </div>
    </footer>
  )
}