/**
 * Recommendation Status Panel Component
 *
 * Displays recommendation summary with pending/received/overdue counts
 * Shows detailed list of pending recommendations with quick actions
 *
 * @component
 * Story 4.5: Dexter Agent - Document Manager Dashboard (Task 5, AC3)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2, Clock, AlertCircle, Send } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface PendingRecommendation {
  id: string
  recommenderName: string
  recommenderEmail: string
  scholarshipName: string
  applicationId: string
  deadline: Date
  daysUntilDue: number
  requestedAt: Date
  status: string
  reminderCount: number
  isOverdue: boolean
}

interface RecommendationStatusPanelProps {
  total: number
  received: number
  pending: number
  overdue: number
  pendingList: PendingRecommendation[]
}

export function RecommendationStatusPanel({
  total,
  received,
  pending,
  overdue,
  pendingList,
}: RecommendationStatusPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Recommendation Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-4 bg-blue-50 rounded-lg">
          {total === 0 ? (
            <p className="text-sm text-gray-700">
              No recommendations requested yet. Start by requesting letters for your applications!
            </p>
          ) : (
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {received} of {total} recommendations received
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{received} Received</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span>{pending} Pending</span>
                </div>
                {overdue > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-700 font-medium">{overdue} Overdue</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pending Recommendations List */}
        {pendingList.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Pending Recommendations ({pendingList.length})
            </h4>
            <div className="space-y-3">
              {pendingList.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-3 rounded-lg border ${
                    rec.isOverdue
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Recommender Info */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{rec.recommenderName}</p>
                      <p className="text-xs text-gray-600 truncate">{rec.recommenderEmail}</p>
                    </div>
                    {rec.isOverdue ? (
                      <Badge variant="destructive" className="flex-shrink-0">
                        Overdue
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex-shrink-0 bg-orange-100 text-orange-700 border-orange-300"
                      >
                        {rec.status === 'REMINDED' ? 'Reminded' : 'Pending'}
                      </Badge>
                    )}
                  </div>

                  {/* Scholarship and Deadline */}
                  <div className="text-xs text-gray-600 mb-2">
                    <p className="truncate mb-1">
                      <span className="font-medium">For:</span> {rec.scholarshipName}
                    </p>
                    <p>
                      <span className="font-medium">Due:</span>{' '}
                      {rec.isOverdue ? (
                        <span className="text-red-700 font-medium">
                          {Math.abs(rec.daysUntilDue)} days overdue
                        </span>
                      ) : (
                        <span>
                          in {rec.daysUntilDue} {rec.daysUntilDue === 1 ? 'day' : 'days'}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-gray-500">
                      Requested{' '}
                      {formatDistanceToNow(new Date(rec.requestedAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/applications/${rec.applicationId}/recommendations`}>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        View Details
                      </Button>
                    </Link>
                    {rec.reminderCount < 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send Reminder
                      </Button>
                    )}
                    {rec.reminderCount > 0 && (
                      <span className="text-xs text-gray-500">
                        {rec.reminderCount} {rec.reminderCount === 1 ? 'reminder' : 'reminders'} sent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {total === 0 && (
          <Link href="/dashboard/applications">
            <Button variant="outline" size="sm" className="w-full">
              Request Recommendations
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
