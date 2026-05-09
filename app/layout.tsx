import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Plancia MRD',
  description: 'Plancia MRD',
  icons: {
    icon: '/logo-megarubberduck.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-white text-navy antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
