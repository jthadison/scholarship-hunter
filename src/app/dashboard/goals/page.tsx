/**
 * Goals Dashboard Page
 *
 * Main dashboard for viewing and managing profile improvement goals.
 * Shows active goals, completed goals, and aggregate statistics.
 *
 * Story 5.4: Profile Improvement Tracker
 * AC7: Historical tracking
 *
 * @module app/dashboard/goals/page
 */

'use client'

import React, { useState } from 'react'
import { trpc } from '@/shared/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Target, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react'
import { GoalCreationModal } from '@/components/goals/GoalCreationModal'
import { GoalProgressCard } from '@/components/goals/GoalProgressCard'
import { GoalStatus } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function GoalsDashboardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [newProgress, setNewProgress] = useState<number>(0)

  // Fetch goals
  const { data: activeGoals, isLoading: activeLoading } = trpc.goals.list.useQuery({
    status: GoalStatus.IN_PROGRESS,
  })
  const { data: notStartedGoals } = trpc.goals.list.useQuery({
    status: GoalStatus.NOT_STARTED,
  })
  const { data: completedGoals } = trpc.goals.getHistory.useQuery()
  const { data: stats } = trpc.goals.getStats.useQuery()

  const utils = trpc.useUtils()
  const updateGoal = trpc.goals.update.useMutation({
    onSuccess: () => {
      toast.success('Goal progress updated!')
      utils.goals.list.invalidate()
      utils.goals.getHistory.invalidate()
      utils.goals.getStats.invalidate()
      setUpdateModalOpen(false)
      setSelectedGoalId(null)
      setNewProgress(0)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update goal')
    },
  })

  const handleUpdateClick = (goalId: string) => {
    const goal = [
      ...(activeGoals?.goals || []),
      ...(notStartedGoals?.goals || []),
    ].find((g) => g.id === goalId)

    if (goal) {
      setSelectedGoalId(goalId)
      setNewProgress(goal.currentValue)
      setUpdateModalOpen(true)
    }
  }

  const handleUpdateSubmit = () => {
    if (selectedGoalId) {
      updateGoal.mutate({
        id: selectedGoalId,
        currentValue: newProgress,
      })
    }
  }

  const selectedGoal = [...(activeGoals?.goals || []), ...(notStartedGoals?.goals || [])].find(
    (g) => g.id === selectedGoalId
  )

  if (activeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const allActiveGoals = [
    ...(activeGoals?.goals || []),
    ...(notStartedGoals?.goals || []),
  ]

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Goals Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your profile improvement progress and achieve your goals
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGoals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completedGoals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.inProgressGoals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profile Strength Gained
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              +{stats?.totalProfileStrengthGained || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Active Goals
            {allActiveGoals.length > 0 && (
              <Badge variant="secondary">{allActiveGoals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed
            {(completedGoals?.length || 0) > 0 && (
              <Badge variant="secondary">{completedGoals?.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Goals */}
        <TabsContent value="active" className="space-y-4">
          {allActiveGoals.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Active Goals</CardTitle>
                <CardDescription>
                  Create your first goal to start tracking your profile improvement progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allActiveGoals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleUpdateClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Goals */}
        <TabsContent value="completed" className="space-y-4">
          {!completedGoals || completedGoals.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Completed Goals Yet</CardTitle>
                <CardDescription>
                  Keep working on your active goals to see your achievements here
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={() => {}}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <GoalCreationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => setCreateModalOpen(false)}
      />

      {/* Update Progress Modal */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Goal Progress</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="progress">Current Progress</Label>
                <Input
                  id="progress"
                  type="number"
                  step="any"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Target: {selectedGoal.targetValue}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={updateGoal.isPending}>
              {updateGoal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
