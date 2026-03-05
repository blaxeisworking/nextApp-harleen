import { clerkMiddleware } from '@clerk/nextjs/server'

// Use the default Clerk middleware so that calls to auth()
// in server components and route handlers can detect it reliably.
export default clerkMiddleware()

// Match all application routes, excluding Next.js internals and static assets.
export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/(api|trpc)(.*)',
  ],
}