import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CivilForm - Revit 평가 시스템',
  description: '토목공학 학생을 위한 Revit 프로젝트 자동 평가 및 피드백 시스템',
  icons: {
    icon: '/favicon.ico',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
