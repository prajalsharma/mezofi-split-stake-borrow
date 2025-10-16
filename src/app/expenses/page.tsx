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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import {
  Plus,
  Receipt,
  Upload,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [groupsRes, expensesRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/expenses/1"), // Fetch expenses for group 1 as demo
      ])
      const groupsData = await groupsRes.json()
      const expensesData = await expensesRes.json()
      setGroups(groupsData)
      setExpenses(expensesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const expense = {
      groupId: parseInt(formData.get("groupId") as string),
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
      paidById: 1, // Mock user ID
      category: formData.get("category") as string,
      date: new Date().toISOString(),
      splitType: formData.get("splitType") as string,
    }

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      })

      if (response.ok) {
        setDialogOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error adding expense:", error)
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (filter === "all") return true
    if (filter === "paid") return expense.splits?.every((s: any) => s.paid)
    if (filter === "pending") return expense.splits?.some((s: any) => !s.paid)
    return true
  })

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Food: "bg-orange-500",
      Transport: "bg-blue-500",
      Accommodation: "bg-purple-500",
      Activities: "bg-green-500",
      Other: "bg-gray-500",
    }
    return colors[category] || colors.Other
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">Track and split bills with your groups</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Split a bill with your group members
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Dinner at restaurant"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="groupId">Group</Label>
                    <Select name="groupId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue="Food">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Transport">Transport</SelectItem>
                        <SelectItem value="Accommodation">Accommodation</SelectItem>
                        <SelectItem value="Activities">Activities</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="splitType">Split Type</Label>
                  <Select name="splitType" defaultValue="EQUAL">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EQUAL">Equal Split</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage Split</SelectItem>
                      <SelectItem value="EXACT">Exact Amounts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="receipt"
                      name="receipt"
                      type="file"
                      accept="image/*"
                      className="cursor-pointer"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
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
                    Add Expense
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Tabs value={filter} onValueChange={setFilter} className="w-full">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="paid">Settled</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search expenses..." className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-destructive/10">
                          <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{expense.description}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Badge variant="outline" className={getCategoryColor(expense.category) + " text-white border-0"}>
                              {expense.category}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {expense.splits?.length || 0} people
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Paid by</span>
                              <span className="font-medium">{expense.paidBy?.name || "Unknown"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Split type</span>
                              <Badge variant="secondary">{expense.splitType}</Badge>
                            </div>
                            {expense.splits && expense.splits.length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Split details:</p>
                                <div className="space-y-1">
                                  {expense.splits.map((split: any) => (
                                    <div key={split.id} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        {split.paid ? (
                                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <XCircle className="h-3 w-3 text-red-500" />
                                        )}
                                        <span>{split.user?.name || "Unknown"}</span>
                                      </div>
                                      <span className="font-medium">${split.amount.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right md:text-right text-center">
                        <p className="text-2xl font-bold text-primary">${expense.amount.toFixed(2)}</p>
                        <Badge
                          variant={expense.splits?.every((s: any) => s.paid) ? "default" : "secondary"}
                          className="mt-2"
                        >
                          {expense.splits?.every((s: any) => s.paid) ? "Settled" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {filteredExpenses.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filter === "all"
                      ? "Add your first expense to get started"
                      : `No ${filter} expenses at the moment`}
                  </p>
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}