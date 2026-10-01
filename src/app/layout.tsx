import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/contexts/toast-context'
import { ToastContainer } from '@/components/ui/toast'
import { Analytics } from '@vercel/analytics/next'
import { PwaRegister } from '@/components/pwa/pwa-register'
import { InstallBanner } from '@/components/pwa/install-prompt'
import { CapacitorBackButton } from '@/components/capacitor/capacitor-back-button'
import { CapacitorKeyboard } from '@/components/capacitor/capacitor-keyboard'
import { CapacitorAuthListener } from '@/components/capacitor/capacitor-auth-listener'

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
    default: 'Nuzigo — Learning, Teaching, and Growing Together',
    template: '%s | Nuzigo',
  },
  description: 'Nuzigo is the modern, connected education platform for independent tutors, curious students, and engaged parents.',
  manifest: '/manifest.json',
  applicationName: 'Nuzigo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nuzigo',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
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
        <ToastProvider>
          {children}
          <ToastContainer />
          <PwaRegister />
          <InstallBanner />
          <CapacitorBackButton />
          <CapacitorKeyboard />
          <CapacitorAuthListener />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
