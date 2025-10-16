"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import {
  Coins,
  Plus,
  TrendingUp,
  Shield,
  Info,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  X,
  Bitcoin,
  DollarSign,
  Percent,
  Clock,
  ArrowRight,
} from "lucide-react";

interface Loan {
  id: string;
  collateralBTC: number;
  borrowedMUSD: number;
  ltv: number;
  interestRate: number;
  status: "open" | "closed";
  createdAt: string;
  accruedInterest: number;
}

export default function BorrowPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/loans");
      const data = await res.json();
      
      // Calculate accrued interest for demo
      const loansWithInterest = data.loans?.map((loan: any) => {
        const daysSinceCreation = Math.floor(
          (new Date().getTime() - new Date(loan.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const accruedInterest = loan.borrowedMUSD * (loan.interestRate / 100) * (daysSinceCreation / 365);
        
        return {
          ...loan,
          accruedInterest,
        };
      }) || [];

      setLoans(loansWithInterest);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const openLoan = async (data: {
    collateralBTC: number;
    borrowedMUSD: number;
  }) => {
    try {
      const ltv = (data.borrowedMUSD / (data.collateralBTC * 65000)) * 100; // Mock BTC price at $65k
      
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user-1", // Mock user
          collateralBTC: data.collateralBTC,
          borrowedMUSD: data.borrowedMUSD,
          ltv,
          interestRate: 5.5, // Mock rate
          status: "open",
        }),
      });

      if (res.ok) {
        await fetchLoans();
        setShowBorrowModal(false);
      }
    } catch (error) {
      console.error("Error opening loan:", error);
    }
  };

  const repayLoan = async (loanId: string) => {
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      if (res.ok) {
        await fetchLoans();
        setSelectedLoan(null);
      }
    } catch (error) {
      console.error("Error repaying loan:", error);
    }
  };

  const activeLoans = loans.filter(l => l.status === "open");
  const totalBorrowed = activeLoans.reduce((sum, l) => sum + l.borrowedMUSD, 0);
  const totalCollateral = activeLoans.reduce((sum, l) => sum + l.collateralBTC, 0);
  const avgLTV = activeLoans.length > 0 
    ? activeLoans.reduce((sum, l) => sum + l.ltv, 0) / activeLoans.length 
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        {/* Header with Info Banner */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Borrow MUSD</h1>
              <p className="text-muted-foreground mt-1">
                Borrow MUSD against your BTC collateral on Mezo
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBorrowModal(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="w-5 h-5" />
              Open Position
            </motion.button>
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-start gap-3"
          >
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <strong>Demo Mode:</strong> This is a simulated borrowing interface. Real Mezo integration would require
                connecting a Mezo-compatible wallet and signing on-chain transactions.
              </p>
              <a
                href="https://mezo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2"
              >
                Learn how Mezo borrowing works
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: "Total Borrowed", 
              value: `${totalBorrowed.toFixed(2)} MUSD`, 
              icon: DollarSign, 
              color: "bg-blue-500",
              change: "+12.5%"
            },
            { 
              label: "Total Collateral", 
              value: `${totalCollateral.toFixed(4)} BTC`, 
              icon: Bitcoin, 
              color: "bg-orange-500",
              change: "≈ $" + (totalCollateral * 65000).toFixed(0)
            },
            { 
              label: "Avg LTV", 
              value: `${avgLTV.toFixed(1)}%`, 
              icon: Percent, 
              color: avgLTV > 75 ? "bg-red-500" : avgLTV > 60 ? "bg-yellow-500" : "bg-green-500",
              change: avgLTV > 75 ? "High Risk" : avgLTV > 60 ? "Moderate" : "Safe"
            },
            { 
              label: "Active Positions", 
              value: activeLoans.length, 
              icon: Coins, 
              color: "bg-purple-500",
              change: `${loans.filter(l => l.status === "closed").length} closed`
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-2xl p-6 shadow-md border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            How Mezo Borrowing Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Post BTC Collateral",
                description: "Lock your Bitcoin as collateral on the Mezo network to secure your loan.",
              },
              {
                step: "2",
                title: "Borrow MUSD",
                description: "Receive MUSD (Mezo's native stablecoin) based on your collateral value and LTV ratio.",
              },
              {
                step: "3",
                title: "Repay & Reclaim",
                description: "Repay your MUSD loan plus interest to unlock and reclaim your BTC collateral.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative p-4 bg-muted/30 rounded-xl">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2 mt-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Positions */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Positions</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center border border-border">
              <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Borrow Positions</h3>
              <p className="text-muted-foreground mb-6">
                Open your first position to borrow MUSD against BTC collateral
              </p>
              <button
                onClick={() => setShowBorrowModal(true)}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Open Your First Position
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan, idx) => {
                const isHealthy = loan.ltv < 75;
                const btcValue = loan.collateralBTC * 65000; // Mock BTC price

                return (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-card rounded-2xl p-6 shadow-md border-2 ${
                      loan.status === "closed" 
                        ? "border-muted opacity-60" 
                        : isHealthy 
                        ? "border-green-500/30" 
                        : "border-yellow-500/30"
                    } hover:shadow-xl transition-all cursor-pointer`}
                    onClick={() => setSelectedLoan(loan)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-foreground">
                            Position #{loan.id.slice(0, 8)}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            loan.status === "closed" 
                              ? "bg-muted text-muted-foreground" 
                              : isHealthy
                              ? "bg-green-500/20 text-green-700 dark:text-green-300"
                              : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                          }`}>
                            {loan.status === "closed" ? "Closed" : isHealthy ? "Healthy" : "Warning"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Opened {new Date(loan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`w-16 h-16 rounded-full ${
                        loan.status === "closed" ? "bg-muted" : "bg-primary/20"
                      } flex items-center justify-center`}>
                        {loan.status === "closed" ? (
                          <CheckCircle className="w-8 h-8 text-muted-foreground" />
                        ) : (
                          <Bitcoin className="w-8 h-8 text-primary" />
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Collateral</p>
                        <p className="font-semibold text-foreground">{loan.collateralBTC.toFixed(4)} BTC</p>
                        <p className="text-xs text-muted-foreground">≈ ${btcValue.toFixed(0)}</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Borrowed</p>
                        <p className="font-semibold text-primary">{loan.borrowedMUSD.toFixed(2)} MUSD</p>
                        <p className="text-xs text-muted-foreground">+ {loan.accruedInterest.toFixed(2)} interest</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">LTV Ratio</p>
                        <p className={`font-semibold ${
                          loan.ltv > 75 ? "text-red-500" : loan.ltv > 60 ? "text-yellow-500" : "text-green-500"
                        }`}>
                          {loan.ltv.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Max: 80%</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                        <p className="font-semibold text-foreground">{loan.interestRate}% APR</p>
                        <p className="text-xs text-muted-foreground">Fixed rate</p>
                      </div>
                    </div>

                    {/* LTV Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Loan-to-Value</span>
                        <span>{loan.ltv.toFixed(1)}% of max</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(loan.ltv / 80) * 100}%` }}
                          className={`h-full ${
                            loan.ltv > 75 ? "bg-red-500" : loan.ltv > 60 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    {loan.status === "open" && (
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            repayLoan(loan.id);
                          }}
                          className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                          Repay Loan
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Borrow Modal */}
        {showBorrowModal && (
          <BorrowModal
            onClose={() => setShowBorrowModal(false)}
            onBorrow={openLoan}
          />
        )}

        {/* Loan Detail Modal */}
        {selectedLoan && (
          <LoanDetailModal
            loan={selectedLoan}
            onClose={() => setSelectedLoan(null)}
            onRepay={() => {
              repayLoan(selectedLoan.id);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

function BorrowModal({
  onClose,
  onBorrow,
}: {
  onClose: () => void;
  onBorrow: (data: { collateralBTC: number; borrowedMUSD: number }) => void;
}) {
  const [step, setStep] = useState(1);
  const [collateralBTC, setCollateralBTC] = useState("");
  const [borrowedMUSD, setBorrowedMUSD] = useState("");

  const btcPrice = 65000; // Mock BTC price
  const maxLTV = 75; // Conservative max LTV
  const interestRate = 5.5;

  const collateralValue = parseFloat(collateralBTC || "0") * btcPrice;
  const maxBorrow = collateralValue * (maxLTV / 100);
  const currentLTV = collateralValue > 0 ? (parseFloat(borrowedMUSD || "0") / collateralValue) * 100 : 0;
  const isValid = currentLTV <= maxLTV && parseFloat(borrowedMUSD || "0") > 0 && parseFloat(collateralBTC || "0") > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Open Borrow Position</h2>
            <p className="text-sm text-muted-foreground mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">
              <strong>Demo Only:</strong> Real Mezo integration requires wallet signing and on-chain transactions.
              This is a simulated flow for demonstration purposes.
            </p>
          </div>
        </div>

        {/* Step 1: Collateral */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                BTC Collateral Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={collateralBTC}
                  onChange={(e) => setCollateralBTC(e.target.value)}
                  placeholder="0.5"
                  className="w-full px-4 py-4 pr-16 rounded-xl border border-border bg-background text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold flex items-center gap-2">
                  <Bitcoin className="w-5 h-5" />
                  BTC
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                ≈ ${collateralValue.toFixed(2)} USD at current price
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">BTC Price</span>
                <span className="font-semibold text-foreground">${btcPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Borrow (75% LTV)</span>
                <span className="font-semibold text-primary">{maxBorrow.toFixed(2)} MUSD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-semibold text-foreground">{interestRate}% APR</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={parseFloat(collateralBTC || "0") <= 0}
              className="w-full px-4 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Borrow Amount */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                MUSD Borrow Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  value={borrowedMUSD}
                  onChange={(e) => setBorrowedMUSD(e.target.value)}
                  placeholder="10000"
                  className="w-full px-4 py-4 pr-24 rounded-xl border border-border bg-background text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  MUSD
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Max: {maxBorrow.toFixed(2)} MUSD
              </p>
            </div>

            {/* LTV Indicator */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Loan-to-Value (LTV)</span>
                <span className={`font-semibold ${
                  currentLTV > maxLTV ? "text-red-500" :
                  currentLTV > 60 ? "text-yellow-500" :
                  "text-green-500"
                }`}>
                  {currentLTV.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(currentLTV / maxLTV) * 100}%` }}
                  className={`h-full ${
                    currentLTV > maxLTV ? "bg-red-500" :
                    currentLTV > 60 ? "bg-yellow-500" :
                    "bg-green-500"
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>Safe: &lt;60%</span>
                <span>Max: {maxLTV}%</span>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collateral</span>
                <span className="font-semibold text-foreground">{collateralBTC} BTC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Borrowing</span>
                <span className="font-semibold text-primary">{borrowedMUSD || "0"} MUSD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current LTV</span>
                <span className="font-semibold text-foreground">{currentLTV.toFixed(1)}%</span>
              </div>
            </div>

            {currentLTV > maxLTV && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  LTV exceeds maximum allowed. Reduce borrow amount or increase collateral.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-4 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!isValid}
                className="flex-1 px-4 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Review
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-lg mb-4">Position Summary</h3>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collateral</span>
                <span className="font-semibold text-foreground">{collateralBTC} BTC (${collateralValue.toFixed(2)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Borrowing</span>
                <span className="font-semibold text-primary text-lg">{borrowedMUSD} MUSD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LTV Ratio</span>
                <span className={`font-semibold ${
                  currentLTV > 60 ? "text-yellow-500" : "text-green-500"
                }`}>
                  {currentLTV.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-semibold text-foreground">{interestRate}% APR</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-border">
                <span className="text-muted-foreground">Est. Monthly Interest</span>
                <span className="font-semibold text-foreground">
                  {(parseFloat(borrowedMUSD) * (interestRate / 100) / 12).toFixed(2)} MUSD
                </span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground mb-2">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Your BTC will be locked as collateral (simulated)</li>
                  <li>MUSD will be credited to your wallet</li>
                  <li>Interest accrues daily at {interestRate}% APR</li>
                  <li>Monitor your LTV to avoid liquidation risk</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-4 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => onBorrow({
                  collateralBTC: parseFloat(collateralBTC),
                  borrowedMUSD: parseFloat(borrowedMUSD),
                })}
                className="flex-1 px-4 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Confirm & Borrow
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function LoanDetailModal({
  loan,
  onClose,
  onRepay,
}: {
  loan: Loan;
  onClose: () => void;
  onRepay: () => void;
}) {
  const btcValue = loan.collateralBTC * 65000;
  const totalOwed = loan.borrowedMUSD + loan.accruedInterest;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-border"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Position Details</h2>
            <p className="text-sm text-muted-foreground mt-1">#{loan.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                loan.status === "closed" 
                  ? "bg-muted text-muted-foreground"
                  : loan.ltv < 75
                  ? "bg-green-500/20 text-green-700 dark:text-green-300"
                  : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
              }`}>
                {loan.status === "closed" ? "Closed" : loan.ltv < 75 ? "Healthy" : "Warning"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Opened</span>
              <span className="text-sm font-semibold text-foreground">
                {new Date(loan.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Collateral</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">BTC Locked</span>
              <div className="text-right">
                <p className="font-semibold text-foreground">{loan.collateralBTC.toFixed(4)} BTC</p>
                <p className="text-xs text-muted-foreground">≈ ${btcValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Loan Details</h3>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Principal</span>
              <span className="text-sm font-semibold text-foreground">{loan.borrowedMUSD.toFixed(2)} MUSD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Accrued Interest</span>
              <span className="text-sm font-semibold text-primary">{loan.accruedInterest.toFixed(2)} MUSD</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total Owed</span>
              <span className="text-lg font-bold text-primary">{totalOwed.toFixed(2)} MUSD</span>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">LTV Ratio</span>
              <span className={`text-sm font-semibold ${
                loan.ltv > 75 ? "text-red-500" : loan.ltv > 60 ? "text-yellow-500" : "text-green-500"
              }`}>
                {loan.ltv.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Interest Rate</span>
              <span className="text-sm font-semibold text-foreground">{loan.interestRate}% APR</span>
            </div>
          </div>

          {loan.status === "open" && (
            <>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  Repaying this loan will unlock your {loan.collateralBTC.toFixed(4)} BTC collateral (simulated).
                </p>
              </div>

              <button
                onClick={onRepay}
                className="w-full px-4 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Repay {totalOwed.toFixed(2)} MUSD
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}