export const metadata = {
  title: 'DailyBrief AI',
  description: 'Visor de Resúmenes de Noticias del Día',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
