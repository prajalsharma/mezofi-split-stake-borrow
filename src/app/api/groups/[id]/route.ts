import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, groupMembers, expenses, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid group ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const groupId = parseInt(id);

    // Fetch group by id
    const groupResult = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (groupResult.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const group = groupResult[0];

    // Fetch group members with user details
    const membersResult = await db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
        userAddress: users.address,
        userIdFromUsers: users.id,
      })
      .from(groupMembers)
      .leftJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));

    // Transform members data to match response format
    const members = membersResult.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: member.userIdFromUsers!,
        name: member.userName!,
        email: member.userEmail!,
        address: member.userAddress!,
      }
    }));

    // Fetch group expenses with payer details
    const expensesResult = await db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        paidById: expenses.paidById,
        category: expenses.category,
        receiptUrl: expenses.receiptUrl,
        date: expenses.date,
        splitType: expenses.splitType,
        createdAt: expenses.createdAt,
        payerName: users.name,
        payerAddress: users.address,
        payerIdFromUsers: users.id,
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.paidById, users.id))
      .where(eq(expenses.groupId, groupId));

    // Transform expenses data to match response format
    const expensesList = expensesResult.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      paidById: expense.paidById,
      category: expense.category,
      receiptUrl: expense.receiptUrl,
      date: expense.date,
      splitType: expense.splitType,
      createdAt: expense.createdAt,
      paidBy: {
        id: expense.payerIdFromUsers!,
        name: expense.payerName!,
        address: expense.payerAddress!,
      }
    }));

    // Construct comprehensive response object
    const response = {
      id: group.id,
      name: group.name,
      description: group.description,
      createdById: group.createdById,
      createdAt: group.createdAt,
      members: members,
      expenses: expensesList,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}