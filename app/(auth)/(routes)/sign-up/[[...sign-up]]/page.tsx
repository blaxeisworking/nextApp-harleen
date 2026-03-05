import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="w-full max-w-md px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'w-full bg-krea-surface border border-krea-border rounded-xl shadow-lg',
            headerTitle: 'text-krea-text-primary text-xl font-semibold',
            headerSubtitle: 'text-krea-text-secondary text-sm',
            formFieldLabel: 'text-krea-text-secondary text-sm',
            formFieldInput:
              'bg-krea-node border border-krea-node-border text-krea-text-primary rounded-lg focus:ring-2 focus:ring-krea-primary focus:border-krea-primary',
            formButtonPrimary: 'bg-krea-primary text-white hover:bg-krea-primary/90 rounded-lg font-medium',
            footerActionLink: 'text-krea-primary hover:text-krea-primary/80 text-sm',
            dividerLine: 'bg-krea-border',
            dividerText: 'text-krea-text-muted bg-krea-surface',
            socialButtonsBlockButton:
              'bg-krea-node border border-krea-node-border hover:bg-krea-node-hover text-krea-text-primary rounded-lg',
          },
        }}
      />
    </div>
  )
}