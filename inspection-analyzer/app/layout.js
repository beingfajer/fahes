import '@/styles/globals.css'
import Header from '@/components/Header'

export const metadata = {
  title: 'Fahes - Inspection Report Analyzer',
  description: 'AI-powered inspection report analyzer',
}

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        <main className="app-main">
          {children}
        </main>
      </body>
    </html>
  )
}
