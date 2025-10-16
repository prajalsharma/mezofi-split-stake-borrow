"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Receipt,
  Users,
  TrendingUp,
  Coins,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Expenses",
    icon: Receipt,
    href: "/expenses",
  },
  {
    title: "Groups",
    icon: Users,
    href: "/groups",
  },
  {
    title: "Trip Pots",
    icon: Coins,
    href: "/pots",
  },
  {
    title: "Borrow",
    icon: TrendingUp,
    href: "/borrow",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export { menuItems }

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function Sidebar({ isOpen = true, onClose, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-sm font-medium text-muted-foreground">
            Navigation
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg bg-gradient-to-r from-primary/10 to-destructive/10 p-3",
            collapsed && "justify-center"
          )}
        >
          {!collapsed ? (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Total Balance
              </p>
              <p className="text-lg font-bold text-primary truncate">
                $12,450.00
              </p>
            </div>
          ) : (
            <Coins className="h-5 w-5 text-primary" />
          )}
        </div>
      </div>
    </aside>
  )
}