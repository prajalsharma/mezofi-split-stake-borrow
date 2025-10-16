"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import {
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Receipt,
  UserPlus,
  Settings,
  ChevronRight,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups")
      const data = await response.json()
      setGroups(data)
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const group = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      createdById: 1, // Mock user ID
    }

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(group),
      })

      if (response.ok) {
        setDialogOpen(false)
        fetchGroups()
      }
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const viewGroupDetails = async (groupId: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      const data = await response.json()
      setSelectedGroup(data)
      setDetailsOpen(true)
    } catch (error) {
      console.error("Error fetching group details:", error)
    }
  }

  const calculateSettlements = (group: any) => {
    if (!group?.expenses) return []

    // Calculate balances for each member
    const balances: Record<number, number> = {}
    
    group.expenses.forEach((expense: any) => {
      // Person who paid gets credited
      balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.amount

      // People who owe get debited
      expense.splits?.forEach((split: any) => {
        if (!split.paid) {
          balances[split.userId] = (balances[split.userId] || 0) - split.amount
        }
      })
    })

    // Create settlement suggestions
    const settlements: any[] = []
    const creditors = Object.entries(balances).filter(([_, amount]) => amount > 0.01)
    const debtors = Object.entries(balances).filter(([_, amount]) => amount < -0.01)

    debtors.forEach(([debtorId, debtAmount]) => {
      const debtor = group.members?.find((m: any) => m.userId === parseInt(debtorId))
      let remaining = Math.abs(debtAmount)

      creditors.forEach(([creditorId, creditAmount]) => {
        if (remaining > 0.01 && creditAmount > 0.01) {
          const settleAmount = Math.min(remaining, creditAmount)
          const creditor = group.members?.find((m: any) => m.userId === parseInt(creditorId))

          settlements.push({
            from: debtor?.user,
            to: creditor?.user,
            amount: settleAmount,
          })

          remaining -= settleAmount
          balances[parseInt(creditorId)] = creditAmount - settleAmount
        }
      })
    })

    return settlements
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const groupStats = groups.reduce(
    (acc, group) => {
      acc.totalMembers += group.members?.length || 0
      acc.totalExpenses += group.expenses?.length || 0
      acc.totalAmount += group.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0
      return acc
    },
    { totalMembers: 0, totalExpenses: 0, totalAmount: 0 }
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
            <p className="text-muted-foreground">Manage your expense groups and members</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Set up a new group for shared expenses
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Tokyo Trip 2024"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Planning our amazing trip to Tokyo..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-primary to-destructive hover:opacity-90"
                  >
                    Create Group
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{groups.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{groupStats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${groupStats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first group to start tracking shared expenses
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                  <CardContent className="p-6" onClick={() => viewGroupDetails(group.id)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-destructive/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-medium">{group.members?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Expenses</span>
                        <span className="font-medium">{group.expenses?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold text-primary">
                          ${group.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0).toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Group Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedGroup?.name}</DialogTitle>
              <DialogDescription>{selectedGroup?.description}</DialogDescription>
            </DialogHeader>

            {selectedGroup && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="settlements">Settlements</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Members</span>
                        </div>
                        <p className="text-2xl font-bold">{selectedGroup.members?.length || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Expenses</span>
                        </div>
                        <p className="text-2xl font-bold">{selectedGroup.expenses?.length || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          ${selectedGroup.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0).toFixed(2) || "0.00"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedGroup.expenses && selectedGroup.expenses.length > 0 ? (
                        <div className="space-y-3">
                          {selectedGroup.expenses.slice(0, 5).map((expense: any) => (
                            <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                              <div>
                                <p className="font-medium text-sm">{expense.description}</p>
                                <p className="text-xs text-muted-foreground">{expense.paidBy?.name}</p>
                              </div>
                              <p className="font-semibold text-primary">${expense.amount.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No expenses yet</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Group Members ({selectedGroup.members?.length || 0})</h3>
                    <Button size="sm" variant="outline" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {selectedGroup.members?.map((member: any) => (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-to-br from-primary to-destructive text-white">
                                  {getInitials(member.user?.name || "?")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.user?.name}</p>
                                <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                              </div>
                            </div>
                            <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                              {member.role}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="settlements" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Settlement Suggestions</h3>
                      <Badge variant="outline">Optimized</Badge>
                    </div>

                    {(() => {
                      const settlements = calculateSettlements(selectedGroup)
                      return settlements.length > 0 ? (
                        <div className="space-y-3">
                          {settlements.map((settlement, index) => (
                            <Card key={index} className="border-2">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 flex-1">
                                    <Avatar>
                                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
                                        {getInitials(settlement.from?.name || "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">{settlement.from?.name}</p>
                                      <p className="text-xs text-muted-foreground">owes</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-center gap-1">
                                    <ArrowRight className="h-5 w-5 text-primary" />
                                    <Badge className="bg-gradient-to-r from-primary to-destructive text-white">
                                      ${settlement.amount.toFixed(2)}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-3 flex-1 justify-end">
                                    <div className="text-right">
                                      <p className="font-medium text-sm">{settlement.to?.name}</p>
                                      <p className="text-xs text-muted-foreground">receives</p>
                                    </div>
                                    <Avatar>
                                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                                        {getInitials(settlement.to?.name || "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>
                                <Button className="w-full mt-4 gap-2" size="sm">
                                  <DollarSign className="h-4 w-4" />
                                  Mark as Settled
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">All Settled Up! 🎉</h3>
                            <p className="text-sm text-muted-foreground">
                              No outstanding balances in this group
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })()}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}