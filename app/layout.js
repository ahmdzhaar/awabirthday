import './globals.css'

export const metadata = {
  title: 'Nazwa Cantik - Happy Birthday',
  description: 'A special birthday surprise just for you.',
}

export const viewport = {
  width: 'device-width', 
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}