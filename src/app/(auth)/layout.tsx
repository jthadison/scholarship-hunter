export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Scholarship Hunter</h1>
        <p className="mt-2 text-muted-foreground">
          Find and apply to scholarships that match your profile
        </p>
      </div>
      {children}
    </div>
  )
}
