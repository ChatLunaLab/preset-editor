import { Providers } from "./providers"
import "@/styles/globals.css"

interface RootLayoutProps {
  children: React.ReactNode
}

export const metadata = {
  title: "ChatLuna Preset Editor",
  description: "A preset editor for ChatLuna",
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}