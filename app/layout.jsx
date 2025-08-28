import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "HomeXpert - Your Home Service Expert",
  description: "Connect with trusted home service professionals",
  generator: 'v0.dev'
}

export default async function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <div id="dialog-root" />
      </body>
    </html>
  )
}
