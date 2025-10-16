"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  Receipt,
  Users,
  TrendingUp,
  Coins,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

export default function LandingPage() {
  const [walletConnected, setWalletConnected] = useState(false)

  const connectWallet = () => {
    setWalletConnected(true)
  }

  const features = [
    {
      icon: Receipt,
      title: "Split Bills Easily",
      description: "Splitwise-style expense tracking with smart calculations and settlement suggestions.",
      gradient: "from-red-500 to-orange-500",
    },
    {
      icon: Users,
      title: "Group Management",
      description: "Create groups for trips, roommates, or any shared expenses with friends.",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      icon: Coins,
      title: "Trip Pot Staking",
      description: "Stake MUSD in group pools and earn rewards while saving for group expenses.",
      gradient: "from-amber-500 to-red-600",
    },
    {
      icon: TrendingUp,
      title: "Mezo Borrowing",
      description: "Access instant liquidity by borrowing against your crypto collateral on Mezo.",
      gradient: "from-red-600 to-rose-500",
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "Blockchain-powered transparency with your wallet, your keys, your control.",
      gradient: "from-rose-500 to-red-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant settlements and real-time updates for all your financial activities.",
      gradient: "from-red-500 to-orange-600",
    },
  ]

  const stats = [
    { label: "Total Volume", value: "$2.4M+", icon: TrendingUp },
    { label: "Active Users", value: "12,500+", icon: Users },
    { label: "Groups Created", value: "3,200+", icon: Users },
    { label: "Loans Issued", value: "$890K+", icon: Coins },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-destructive flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
              MezoFi
            </span>
          </div>

          {walletConnected ? (
            <Link href="/dashboard">
              <Button className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              onClick={connectWallet}
              className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-destructive/5 to-background -z-10" />
        <div className="container px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-gradient-to-r from-primary to-destructive text-white">
              Powered by Mezo Network
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Split Bills, Stake, &{" "}
              <span className="bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                Borrow Smart
              </span>
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
              The ultimate web3 finance app combining Splitwise-style expense splitting,
              group staking pools, and Mezo-powered borrowing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {walletConnected ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90 text-lg px-8 py-6"
                  >
                    Launch App
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={connectWallet}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90 text-lg px-8 py-6"
                >
                  <Wallet className="h-5 w-5" />
                  Get Started
                </Button>
              )}
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-card/50">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-destructive/10 mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              Everything You Need for{" "}
              <span className="bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                Group Finance
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage shared expenses, grow your savings together, and access liquidity when you need it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className={`inline-flex w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32 bg-card/50">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-destructive text-white font-bold text-2xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Connect Wallet</h3>
              <p className="text-muted-foreground">
                Link your crypto wallet to get started with MezoFi in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-destructive text-white font-bold text-2xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Create or Join Groups</h3>
              <p className="text-muted-foreground">
                Set up groups for trips, roommates, or any shared financial activity.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-destructive text-white font-bold text-2xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Split, Stake & Borrow</h3>
              <p className="text-muted-foreground">
                Track expenses, earn staking rewards, and access instant loans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <Card className="border-2 bg-gradient-to-br from-primary/10 via-destructive/10 to-background">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of users managing their group finances smarter with MezoFi.
              </p>
              {walletConnected ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90 text-lg px-8 py-6"
                  >
                    Launch Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={connectWallet}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90 text-lg px-8 py-6"
                >
                  <Wallet className="h-5 w-5" />
                  Connect Wallet to Start
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card/50">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-destructive flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                MezoFi
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 MezoFi. Powered by Mezo Network.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}