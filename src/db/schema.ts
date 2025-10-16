import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').notNull(),
});

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});

export const groupMembers = sqliteTable('group_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').notNull(),
  joinedAt: text('joined_at').notNull(),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  paidById: integer('paid_by_id').notNull().references(() => users.id),
  category: text('category').notNull(),
  receiptUrl: text('receipt_url'),
  date: text('date').notNull(),
  splitType: text('split_type').notNull(),
  createdAt: text('created_at').notNull(),
});

export const expenseSplits = sqliteTable('expense_splits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  expenseId: integer('expense_id').notNull().references(() => expenses.id),
  userId: integer('user_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  percentage: real('percentage'),
  paid: integer('paid', { mode: 'boolean' }).notNull().default(false),
  paidAt: text('paid_at'),
});

export const settlements = sqliteTable('settlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  fromUserId: integer('from_user_id').notNull().references(() => users.id),
  toUserId: integer('to_user_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  settled: integer('settled', { mode: 'boolean' }).notNull().default(false),
  settledAt: text('settled_at'),
});

export const loans = sqliteTable('loans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  collateralAmount: real('collateral_amount').notNull(),
  interestRate: real('interest_rate').notNull(),
  duration: integer('duration').notNull(),
  status: text('status').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  createdAt: text('created_at').notNull(),
});

export const stakes = sqliteTable('stakes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  userId: integer('user_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  rewardRate: real('reward_rate').notNull(),
  claimedRewards: real('claimed_rewards').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});