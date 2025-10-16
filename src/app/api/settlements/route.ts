import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settlements } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, fromUserId, toUserId, amount, settled } = body;

    // Validate required fields
    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!fromUserId) {
      return NextResponse.json(
        { error: 'From user ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!toUserId) {
      return NextResponse.json(
        { error: 'To user ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Amount is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate field types
    const parsedGroupId = parseInt(groupId);
    const parsedFromUserId = parseInt(fromUserId);
    const parsedToUserId = parseInt(toUserId);
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedGroupId)) {
      return NextResponse.json(
        { error: 'Group ID must be a valid integer', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (isNaN(parsedFromUserId)) {
      return NextResponse.json(
        { error: 'From user ID must be a valid integer', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (isNaN(parsedToUserId)) {
      return NextResponse.json(
        { error: 'To user ID must be a valid integer', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (isNaN(parsedAmount)) {
      return NextResponse.json(
        { error: 'Amount must be a valid number', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate fromUserId and toUserId are different
    if (parsedFromUserId === parsedToUserId) {
      return NextResponse.json(
        { error: 'From user and to user must be different', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Prepare settlement data
    const isSettled = settled === true;
    const settlementData = {
      groupId: parsedGroupId,
      fromUserId: parsedFromUserId,
      toUserId: parsedToUserId,
      amount: parsedAmount,
      settled: isSettled,
      settledAt: isSettled ? new Date().toISOString() : null,
    };

    // Insert settlement record
    const newSettlement = await db
      .insert(settlements)
      .values(settlementData)
      .returning();

    return NextResponse.json(newSettlement[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}