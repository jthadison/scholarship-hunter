/**
 * Story 1.10: Profile Version History Component
 * Displays chronological list of profile versions with change summaries
 */

'use client'

import { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Clock, ChevronRight, ChevronDown } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { formatFieldName } from '../lib/change-detection'

export function ProfileVersionHistory() {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  // Fetch version history
  const { data, isLoading, error } = trpc.profile.getVersionHistory.useQuery({
    limit,
    offset,
  })

  // Fetch selected version details
  const { data: selectedVersion } = trpc.profile.getVersion.useQuery(
    { versionId: selectedVersionId! },
    { enabled: !!selectedVersionId }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  if (!data || data.versions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No version history yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your profile changes will appear here after you make updates
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {data.versions.map((version, index) => {
        const isExpanded = selectedVersionId === version.id

        return (
          <Card key={version.id}>
            <CardContent className="py-4">
              <div
                className="cursor-pointer"
                onClick={() =>
                  setSelectedVersionId(isExpanded ? null : version.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {format(new Date(version.createdAt), 'PPP p')}
                      </p>
                      <Badge variant="outline" className="ml-2">
                        {formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                        })}
                      </Badge>
                      {index === 0 && <Badge variant="default">Current</Badge>}
                    </div>

                    {version.changedFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {version.changedFields.slice(0, 5).map((field) => (
                          <Badge
                            key={field}
                            variant="secondary"
                            className="text-xs"
                          >
                            {formatFieldName(field)}
                          </Badge>
                        ))}
                        {version.changedFields.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{version.changedFields.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {version.changeReason && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {version.changeReason}
                      </p>
                    )}
                  </div>

                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground mt-1" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                  )}
                </div>
              </div>

              {/* Expanded view */}
              {isExpanded && selectedVersion && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Changed Fields Summary */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Changed Fields
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVersion.changedFields.map((field) => (
                        <Badge key={field} variant="secondary">
                          {formatFieldName(field)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Profile Snapshot (read-only view) */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Profile Snapshot
                    </h4>
                    <div className="rounded-lg bg-muted p-4">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {Object.entries(selectedVersion.snapshotData as any)
                          .filter(
                            ([key]) =>
                              ![
                                'id',
                                'studentId',
                                'createdAt',
                                'updatedAt',
                              ].includes(key)
                          )
                          .map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <span className="font-medium text-muted-foreground block">
                                {formatFieldName(key)}
                              </span>
                              <span className="block">
                                {value === null || value === undefined
                                  ? '-'
                                  : typeof value === 'object'
                                  ? JSON.stringify(value).length > 50
                                    ? JSON.stringify(value).substring(0, 50) +
                                      '...'
                                    : JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Pagination */}
      {data.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setOffset((prev) => prev + limit)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
