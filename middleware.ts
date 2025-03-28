import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Check if the CSRF token cookie exists
  const csrfCookie = request.cookies.get("csrf_token")

  // If no CSRF token exists, generate a new one
  if (!csrfCookie) {
    // Generate a random token using Web Crypto API
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const token = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    // Hash the token for storage
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedToken = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    // Set the cookie in the response
    response.cookies.set("csrf_token", hashedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    })

    // Add the token to the response headers so client-side JavaScript can access it
    response.headers.set("X-CSRF-Token", token)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - API routes
     * - Static files
     * - _next files
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

