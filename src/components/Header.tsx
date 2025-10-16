"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, Moon, Sun, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface HeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
  isAuthenticated?: boolean
}

export function Header({ onMenuClick, showMenuButton = false, isAuthenticated = false }: HeaderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [musdBalance] = useState("0.123")

  useEffect(() => {
    if (isAuthenticated) {
      // Auto-connect wallet for authenticated pages
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
      setWalletAddress(mockAddress)
    }
  }, [isAuthenticated])

  const connectWallet = async () => {
    // Mock wallet connection
    const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    setWalletAddress(mockAddress)
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-destructive flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
              MezoFi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {walletAddress ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 pl-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-destructive text-white text-xs">
                      {formatAddress(walletAddress).slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium hidden sm:block">{formatAddress(walletAddress)}</span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{musdBalance} MUSD</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-mono">{formatAddress(walletAddress)}</p>
                </div>
                <div className="px-2 py-2">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-sm font-semibold">{musdBalance} MUSD</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnectWallet} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={connectWallet}
              className="gap-2 bg-gradient-to-r from-primary to-destructive hover:opacity-90"
            >
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}