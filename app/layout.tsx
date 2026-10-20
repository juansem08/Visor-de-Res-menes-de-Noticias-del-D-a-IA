export const metadata = {
  title: 'Visor de Resúmenes de Noticias del Día | DailyBrief AI',
  description: 'Visor de Resúmenes de Noticias del Día para Wear OS y React Native con Gemini SDK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#05070E', overflowX: 'hidden' }}>{children}</body>
    </html>
  )
}
