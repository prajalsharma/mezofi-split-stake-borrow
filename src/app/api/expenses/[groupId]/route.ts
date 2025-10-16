import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses, expenseSplits, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;

    // Validate groupId is a valid integer
    if (!groupId || isNaN(parseInt(groupId))) {
      return NextResponse.json(
        { 
          error: 'Valid group ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const groupIdInt = parseInt(groupId);

    // Extract pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch expenses with payer details
    const expensesWithPayer = await db
      .select({
        expense: expenses,
        paidBy: users,
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.paidById, users.id))
      .where(eq(expenses.groupId, groupIdInt))
      .limit(limit)
      .offset(offset);

    // Construct response with nested data
    const result = await Promise.all(
      expensesWithPayer.map(async ({ expense, paidBy }) => {
        // Fetch splits for each expense
        const splitsWithUsers = await db
          .select({
            split: expenseSplits,
            user: users,
          })
          .from(expenseSplits)
          .leftJoin(users, eq(expenseSplits.userId, users.id))
          .where(eq(expenseSplits.expenseId, expense.id));

        // Format splits with user details
        const formattedSplits = splitsWithUsers.map(({ split, user }) => ({
          id: split.id,
          userId: split.userId,
          amount: split.amount,
          percentage: split.percentage,
          paid: split.paid,
          paidAt: split.paidAt,
          user: user
            ? {
                id: user.id,
                name: user.name,
                address: user.address,
              }
            : null,
        }));

        // Return formatted expense with payer and splits
        return {
          id: expense.id,
          groupId: expense.groupId,
          description: expense.description,
          amount: expense.amount,
          paidById: expense.paidById,
          category: expense.category,
          receiptUrl: expense.receiptUrl,
          date: expense.date,
          splitType: expense.splitType,
          createdAt: expense.createdAt,
          paidBy: paidBy
            ? {
                id: paidBy.id,
                name: paidBy.name,
                address: paidBy.address,
              }
            : null,
          splits: formattedSplits,
        };
      })
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}