import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { LucideIcon } from 'lucide-react'

interface PlaceholderSectionProps {
  title: string
  description: string
  icon: LucideIcon
  epicLabel: string
  illustration?: React.ReactNode
}

export function PlaceholderSection({
  title,
  description,
  icon: Icon,
  epicLabel,
  illustration,
}: PlaceholderSectionProps) {
  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {epicLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          {illustration && <div className="mb-4">{illustration}</div>}
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
