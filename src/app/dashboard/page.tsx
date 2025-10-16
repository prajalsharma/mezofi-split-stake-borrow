"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Users,
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [balance, setBalance] = useState(0)
  const targetBalance = 12450.75

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = targetBalance / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= targetBalance) {
        setBalance(targetBalance)
        clearInterval(interval)
      } else {
        setBalance(current)
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [])

  const stats = [
    {
      title: "Total Balance",
      value: `$${balance.toFixed(2)}`,
      change: "+12.5%",
      trend: "up",
      icon: Wallet,
      gradient: "from-primary to-destructive",
    },
    {
      title: "Active Loans",
      value: "$5,000",
      change: "2 active",
      trend: "neutral",
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Staked Amount",
      value: "$3,250",
      change: "+8.2% APY",
      trend: "up",
      icon: Coins,
      gradient: "from-red-500 to-rose-500",
    },
    {
      title: "Owed to You",
      value: "$1,450",
      change: "From 3 people",
      trend: "up",
      icon: ArrowUpRight,
      gradient: "from-rose-500 to-pink-500",
    },
  ]

  const recentExpenses = [
    {
      id: 1,
      description: "Hotel booking - Tokyo Trip",
      amount: 450,
      group: "Tokyo Trip 2024",
      date: "2 days ago",
      type: "expense",
    },
    {
      id: 2,
      description: "Dinner at izakaya",
      amount: 125,
      group: "Tokyo Trip 2024",
      date: "3 days ago",
      type: "expense",
    },
    {
      id: 3,
      description: "Monthly utilities",
      amount: 247,
      group: "Roommates",
      date: "1 week ago",
      type: "expense",
    },
  ]

  const quickActions = [
    {
      title: "Add Expense",
      description: "Split a new bill",
      icon: Receipt,
      href: "/expenses",
      gradient: "from-primary to-destructive",
    },
    {
      title: "Create Group",
      description: "Start a new group",
      icon: Users,
      href: "/groups",
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Stake MUSD",
      description: "Earn rewards",
      icon: Coins,
      href: "/trip-pot",
      gradient: "from-red-500 to-rose-500",
    },
    {
      title: "Borrow Funds",
      description: "Get instant liquidity",
      icon: TrendingUp,
      href: "/borrow",
      gradient: "from-rose-500 to-pink-500",
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90">
            <Plus className="h-4 w-4" />
            Quick Add Expense
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs">{stat.title}</CardDescription>
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} opacity-10`}>
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === "up" && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                      {stat.trend === "down" && (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs ${stat.trend === "up" ? "text-green-500" : stat.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
                <Link href={action.href}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className={`inline-flex w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Expenses */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Expenses</CardTitle>
                    <CardDescription>Your latest transactions</CardDescription>
                  </div>
                  <Link href="/expenses">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-destructive/10">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{expense.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {expense.group}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{expense.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">-${expense.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Groups */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Groups</CardTitle>
                    <CardDescription>Groups you're part of</CardDescription>
                  </div>
                  <Link href="/groups">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
                        <Users className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Tokyo Trip 2024</p>
                        <p className="text-xs text-muted-foreground">4 members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">$650</p>
                      <p className="text-xs text-muted-foreground">Total expenses</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/10">
                        <Users className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Roommates</p>
                        <p className="text-xs text-muted-foreground">3 members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">$493</p>
                      <p className="text-xs text-muted-foreground">Total expenses</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/10 to-pink-500/10">
                        <Users className="h-4 w-4 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Ski Weekend</p>
                        <p className="text-xs text-muted-foreground">4 members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">$500</p>
                      <p className="text-xs text-muted-foreground">Total expenses</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Staking & Borrowing Overview */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Trip Pot Staking
                </CardTitle>
                <CardDescription>Earn rewards on your staked MUSD</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Staked</span>
                    <span className="text-xl font-bold">$3,250</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Est. Annual Yield</span>
                    <span className="text-lg font-semibold text-green-500">+8.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rewards Earned</span>
                    <span className="text-lg font-semibold text-primary">$155.00</span>
                  </div>
                  <Link href="/trip-pot" className="block">
                    <Button className="w-full gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90">
                      Manage Stakes
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <Card className="border-2 bg-gradient-to-br from-orange-500/5 to-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Mezo Borrowing
                </CardTitle>
                <CardDescription>Your active loan positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Borrowed</span>
                    <span className="text-xl font-bold">$5,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Collateral Value</span>
                    <span className="text-lg font-semibold">$6,500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Interest Rate</span>
                    <span className="text-lg font-semibold text-orange-600">5.5%</span>
                  </div>
                  <Link href="/borrow" className="block">
                    <Button className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90">
                      Manage Loans
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}