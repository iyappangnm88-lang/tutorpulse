import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { ToastProvider } from '@/contexts/toast-context'
import { ToastContainer } from '@/components/ui/toast'
import { Analytics } from '@vercel/analytics/next'
import { PwaRegister } from '@/components/pwa/pwa-register'
import { InstallBanner } from '@/components/pwa/install-prompt'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  themeColor: '#55C832',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: {
    default: 'Nuzilo — Find Top Tutors & Learn Better',
    template: '%s | Nuzilo',
  },
  description:
    'Discover top tutors, explore subjects, book interactive online classes, and track your learning progress with Nuzilo.',
  manifest: '/manifest.json',
  applicationName: 'Nuzilo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nuzilo',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#55C832" />
      </head>
      <body className="h-full antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
        <PwaRegister />
        <InstallBanner />
        <Analytics />
      </body>
    </html>
  )
}
