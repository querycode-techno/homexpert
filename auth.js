import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import bcrypt from "bcryptjs"
import client from "@/lib/db"

export const authOptions = {
  adapter: MongoDBAdapter(client),
  secret: process.env.NEXTAUTH_SECRET || "homexpert-dev-secret-2024",
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        try {
          // Connect to MongoDB
          await client.connect()
          const db = client.db('homexpert')
          
          // Find user by email
          const user = await db.collection('users').findOne(
            { email: credentials.email.toLowerCase() },
            {
              projection: {
                _id: 1,
                userId: 1,
                name: 1,
                email: 1,
                password: 1,
                role: 1,
                profile: 1
              }
            }
          )

          if (!user) {
            throw new Error("Invalid credentials")
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            throw new Error("Invalid credentials")
          }

          // Get role information (without permissions to keep JWT small)
          const role = await db.collection('roles').findOne({ _id: user.role })

          // Return user object (password excluded) - minimal data for JWT
          return {
            id: user._id.toString(),
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: {
              id: role?._id?.toString(),
              name: role?.name || 'user'
            },
            image: user.profile?.url || null,
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error // Re-throw to show proper error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Store ONLY essential user data in JWT - NO PERMISSIONS
      if (user) {
        token.userId = user.userId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Pass cached data from JWT token (no database calls)
      if (token) {
        session.user.id = token.sub
        session.user.userId = token.userId
        session.user.role = token.role
        // Permissions will be fetched separately when needed
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Additional sign-in validation if needed
      return true
    }
  },
  pages: {
    signIn: '/auth/admin-login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("User signed in:", user.email)
    },
    async signOut({ session, token }) {
      console.log("User signed out")
    }
  },
  debug: process.env.NODE_ENV === "development",
}

// Create NextAuth instance
const handler = NextAuth(authOptions)

// For NextAuth v4, create auth function manually
export const auth = async () => {
  const { getServerSession } = await import('next-auth/next')
  return await getServerSession(authOptions)
}

export default handler
export { handler as GET, handler as POST } 