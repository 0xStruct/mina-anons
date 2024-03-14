import './globals.css'
import type { Metadata } from 'next'
import { type ReactNode } from 'react'

import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Mina Anons',
  description: 'Mina Anons - privacy powered by Mina ZK',
}

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="synthwave">
      <body className="container mx-auto">
        <Providers>{props.children}</Providers>
      </body>
    </html>
  )
}
