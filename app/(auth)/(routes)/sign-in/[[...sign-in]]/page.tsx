import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-krea-background">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            cardBox: "bg-krea-surface border border-krea-border rounded-lg shadow-lg",
            headerTitle: "text-krea-text-primary text-xl font-semibold",
            headerSubtitle: "text-krea-text-secondary",
            formFieldLabel: "text-krea-text-secondary text-sm",
            formFieldInput: "bg-krea-node border border-krea-node-border text-krea-text-primary focus:ring-2 focus:ring-krea-primary rounded-lg",
            footerActionLink: "text-krea-primary hover:text-krea-primary/80 text-sm",
            button: "bg-krea-primary text-white hover:bg-krea-primary/90 rounded-lg font-medium",
            dividerLine: "bg-krea-border",
            dividerText: "text-krea-text-muted bg-krea-surface",
          },
        }}
      />
    </div>
  )
}