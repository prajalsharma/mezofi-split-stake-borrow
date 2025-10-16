"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import {
  Coins,
  Plus,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Award,
  ArrowRight,
  Clock,
} from "lucide-react";

interface StakingPool {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: "active" | "completed" | "expired";
  members: {
    id: string;
    name: string;
    avatar: string;
    contributed: number;
    target: number;
  }[];
  rewards: number;
}

export default function PotsPage() {
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stakes");
      const data = await res.json();
      
      // Transform API data to match our interface
      const transformedPools: StakingPool[] = data.stakes?.map((stake: any) => ({
        id: stake.id,
        groupId: stake.groupId,
        groupName: stake.group?.name || "Unknown Group",
        title: stake.title,
        targetAmount: stake.targetAmount,
        currentAmount: stake.currentAmount || 0,
        deadline: stake.deadline,
        status: new Date(stake.deadline) > new Date() 
          ? (stake.currentAmount >= stake.targetAmount ? "completed" : "active")
          : "expired",
        members: stake.contributions?.map((contrib: any) => ({
          id: contrib.userId,
          name: contrib.user?.name || "User",
          avatar: contrib.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contrib.userId}`,
          contributed: contrib.amount,
          target: stake.targetAmount / (stake.contributions?.length || 1),
        })) || [],
        rewards: stake.targetAmount * 0.05, // Mock 5% rewards
      })) || [];

      setPools(transformedPools);
    } catch (error) {
      console.error("Error fetching pools:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPool = async (formData: {
    groupId: string;
    title: string;
    targetAmount: number;
    deadline: string;
  }) => {
    try {
      const res = await fetch("/api/stakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        await fetchPools();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error("Error creating pool:", error);
    }
  };

  const contribute = async (poolId: string, amount: number) => {
    try {
      const pool = pools.find(p => p.id === poolId);
      if (!pool) return;

      const res = await fetch(`/api/stakes/${pool.groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stakeId: poolId,
          userId: "demo-user-1", // Mock user ID
          amount,
        }),
      });

      if (res.ok) {
        await fetchPools();
      }
    } catch (error) {
      console.error("Error contributing:", error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trip Pots</h1>
            <p className="text-muted-foreground mt-1">
              Pool funds together for group activities and earn rewards
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Create Pot
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Pots", value: pools.filter(p => p.status === "active").length, icon: Coins, color: "bg-blue-500" },
            { label: "Total Staked", value: `${pools.reduce((sum, p) => sum + p.currentAmount, 0).toFixed(2)} MUSD`, icon: TrendingUp, color: "bg-green-500" },
            { label: "Completed", value: pools.filter(p => p.status === "completed").length, icon: Award, color: "bg-purple-500" },
            { label: "Total Rewards", value: `${pools.reduce((sum, p) => sum + p.rewards, 0).toFixed(2)} MUSD`, icon: Target, color: "bg-primary" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-2xl p-6 shadow-md border border-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pools Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : pools.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center border border-border">
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Trip Pots Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first pot to start pooling funds with your group
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Pot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pools.map((pool, idx) => {
              const progress = (pool.currentAmount / pool.targetAmount) * 100;
              const daysLeft = Math.ceil((new Date(pool.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

              return (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-card rounded-2xl p-6 shadow-md border-2 ${
                    pool.status === "completed" ? "border-green-500" :
                    pool.status === "expired" ? "border-muted" :
                    "border-primary/30"
                  } hover:shadow-xl transition-all cursor-pointer`}
                  onClick={() => setSelectedPool(pool)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-foreground">{pool.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pool.status === "completed" ? "bg-green-500/20 text-green-700 dark:text-green-300" :
                          pool.status === "expired" ? "bg-muted text-muted-foreground" :
                          "bg-primary/20 text-primary"
                        }`}>
                          {pool.status === "completed" ? "✓ Completed" :
                           pool.status === "expired" ? "Expired" :
                           "Active"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {pool.groupName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{pool.currentAmount.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">of {pool.targetAmount} MUSD</p>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="relative mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-muted"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - progress / 100) }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={pool.status === "completed" ? "text-green-500" : "text-primary"}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Member Avatars */}
                    <div className="flex justify-center -space-x-2">
                      {pool.members.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="relative w-10 h-10 rounded-full border-2 border-card overflow-hidden bg-muted"
                          title={`${member.name}: ${member.contributed} MUSD`}
                        >
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {pool.members.length > 5 && (
                        <div className="w-10 h-10 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                          <span className="text-xs font-semibold text-muted-foreground">+{pool.members.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {daysLeft > 0 ? `${daysLeft}d left` : "Ended"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {pool.rewards.toFixed(0)} MUSD
                      </span>
                    </div>
                    {pool.status === "active" && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          contribute(pool.id, 100);
                        }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"
                      >
                        Contribute
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreatePotModal
            onClose={() => setShowCreateModal(false)}
            onCreate={createPool}
          />
        )}

        {/* Pool Detail Modal */}
        {selectedPool && (
          <PoolDetailModal
            pool={selectedPool}
            onClose={() => setSelectedPool(null)}
            onContribute={(amount) => {
              contribute(selectedPool.id, amount);
              setSelectedPool(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

function CreatePotModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    groupId: "",
    title: "",
    targetAmount: "",
    deadline: "",
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border"
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Create Trip Pot</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Pool funds together with your group for upcoming trips or activities
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Group</label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a group</option>
              <option value="group-1">Weekend Warriors</option>
              <option value="group-2">Office Squad</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Bali Trip 2025"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Target Amount (MUSD)</label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              placeholder="5000"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate({ ...formData, targetAmount: parseFloat(formData.targetAmount) })}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Create Pot
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PoolDetailModal({
  pool,
  onClose,
  onContribute,
}: {
  pool: StakingPool;
  onClose: () => void;
  onContribute: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{pool.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{pool.groupName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-semibold text-foreground">
              {pool.currentAmount} / {pool.targetAmount} MUSD
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(pool.currentAmount / pool.targetAmount) * 100}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        {/* Members */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Contributors</h3>
          <div className="space-y-2">
            {pool.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                  <span className="font-medium text-foreground">{member.name}</span>
                </div>
                <span className="font-semibold text-primary">{member.contributed} MUSD</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contribute */}
        {pool.status === "active" && (
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Contribute</h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount in MUSD"
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => onContribute(parseFloat(amount))}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Contribute
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}