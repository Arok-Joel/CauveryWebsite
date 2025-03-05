# Clerk Authentication Implementation Guide

This guide will help you implement Clerk authentication in your Next.js application to replace the custom JWT authentication that's causing session mixing issues.

## Step 1: Create a Clerk Account

1. Go to [clerk.com](https://clerk.com/) and sign up for an account
2. Create a new application in the Clerk dashboard
3. Configure your application settings:
   - Set your application name
   - Configure the authentication methods (email/password, social logins, etc.)
   - Set up your branding and appearance

## Step 2: Get Your API Keys

1. In the Clerk dashboard, go to the API Keys section
2. Copy your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. Add these to your environment variables:

```
# Clerk Environment Variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/employee/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/employee/dashboard
```

## Step 3: Install Clerk SDK

```bash
bun add @clerk/nextjs
```

## Step 4: Set Up ClerkProvider

Update your `app/layout.tsx` file to include the ClerkProvider:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cauvery Website",
  description: "Official website for Cauvery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className={`${inter.className} h-full`}>
          <TooltipProvider>
            <Navbar />
            {children}
            <Toaster />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

## Step 5: Create Middleware for Route Protection

Create or update your `middleware.ts` file:

```tsx
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/auth/login",
    "/auth/register",
    "/api/webhooks(.*)",
    "/about",
    "/contact",
    "/products",
    "/services",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

## Step 6: Create Sign-In and Sign-Up Pages

### Sign-In Page (`app/auth/login/page.tsx`):

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-lg mx-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Employee Login</h1>
            <p className="text-gray-600">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: "bg-[#3C5A3E] hover:bg-[#2A3F2B] text-white",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}
```

### Sign-Up Page (`app/auth/register/page.tsx`):

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-lg mx-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Employee Registration</h1>
            <p className="text-gray-600">Create your employee account</p>
          </div>

          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: "bg-[#3C5A3E] hover:bg-[#2A3F2B] text-white",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}
```

## Step 7: Update User Components

### User Button Component:

```tsx
import { UserButton } from "@clerk/nextjs";

export function UserProfileButton() {
  return (
    <UserButton
      appearance={{
        elements: {
          userButtonAvatarBox: "w-10 h-10",
        },
      }}
      afterSignOutUrl="/"
    />
  );
}
```

### Protected Page Example:

```tsx
import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function EmployeeDashboard() {
  const { userId } = auth();

  if (!userId) {
    redirect("/auth/login");
  }

  const user = await currentUser();

  return (
    <div>
      <h1>Welcome, {user?.firstName || "Employee"}!</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

## Step 8: Set Up Roles and Permissions

To implement roles (ADMIN, EMPLOYEE), you'll need to use Clerk's metadata feature:

1. When a user signs up, set their role in the user metadata
2. Use the metadata to control access to different parts of your application

Example of setting user metadata:

```tsx
import { clerkClient } from "@clerk/nextjs";

// Set user role
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    role: "EMPLOYEE",
  },
});

// Check user role
const user = await clerkClient.users.getUser(userId);
const isAdmin = user.publicMetadata.role === "ADMIN";
```

## Step 9: Create a Webhook for Database Sync

To keep your Supabase database in sync with Clerk:

1. Set up a webhook in the Clerk dashboard
2. Create an API route to handle the webhook events
3. Update your database when users are created, updated, or deleted

Example webhook handler:

```tsx
// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  // Verify the webhook
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response("Error verifying webhook", { status: 400 });
  }

  // Handle the webhook event
  const eventType = evt.type;

  if (eventType === "user.created") {
    // Create a new user in your database
    await db.user.create({
      data: {
        id: evt.data.id,
        email: evt.data.email_addresses[0].email_address,
        name: `${evt.data.first_name || ""} ${evt.data.last_name || ""}`.trim(),
        role: (evt.data.public_metadata?.role as string) || "EMPLOYEE",
      },
    });
  }

  // Handle other event types as needed

  return new Response("Webhook received", { status: 200 });
}
```

## Step 10: Migrate Existing Users

You'll need to migrate your existing users to Clerk:

1. Export your users from your database
2. Import them into Clerk using the Admin API
3. Update your database to link the Clerk user IDs with your existing records

## Step 11: Update Your UI Components

Replace your custom authentication UI components with Clerk components or create your own using Clerk hooks.

## Step 12: Test and Deploy

1. Test the authentication flow thoroughly
2. Make sure role-based access control works correctly
3. Deploy your application to Netlify

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/nextjs/get-started-with-nextjs)
- [Clerk Webhooks](https://clerk.com/docs/users/sync-data-to-your-backend)
- [Clerk User Management](https://clerk.com/docs/users/user-management)

## Troubleshooting

If you encounter any issues:

1. Check the Clerk documentation
2. Look at the browser console for errors
3. Check the Clerk dashboard for user session information
4. Verify your environment variables are set correctly
