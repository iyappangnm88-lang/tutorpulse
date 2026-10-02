import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/theme-context'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#55C832" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nuzigo_theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="h-full antialiased bg-bg-primary text-text-primary">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
            <PwaRegister />
            <InstallBanner />
            <CapacitorBackButton />
            <CapacitorKeyboard />
            <CapacitorAuthListener />
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
