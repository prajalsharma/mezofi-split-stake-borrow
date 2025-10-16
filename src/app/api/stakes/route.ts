import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stakes } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, userId, amount, startDate, endDate, rewardRate, claimedRewards, active } = body;

    // Validate required fields
    if (!groupId || typeof groupId !== 'number') {
      return NextResponse.json(
        { error: 'Group ID is required and must be a number', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json(
        { error: 'User ID is required and must be a number', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount is required and must be a number', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!startDate || typeof startDate !== 'string') {
      return NextResponse.json(
        { error: 'Start date is required and must be a string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!endDate || typeof endDate !== 'string') {
      return NextResponse.json(
        { error: 'End date is required and must be a string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (rewardRate === undefined || rewardRate === null || typeof rewardRate !== 'number') {
      return NextResponse.json(
        { error: 'Reward rate is required and must be a number', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate rewardRate is non-negative
    if (rewardRate < 0) {
      return NextResponse.json(
        { error: 'Reward rate must be non-negative', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate startDate is valid ISO date
    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Start date must be a valid ISO date string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate endDate is valid ISO date
    const endDateObj = new Date(endDate);
    if (isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: 'End date must be a valid ISO date string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate endDate is after startDate
    if (endDateObj <= startDateObj) {
      return NextResponse.json(
        { error: 'End date must be after start date', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Prepare insert data with defaults
    const insertData = {
      groupId,
      userId,
      amount,
      startDate,
      endDate,
      rewardRate,
      claimedRewards: claimedRewards !== undefined ? claimedRewards : 0,
      active: active !== undefined ? active : true,
      createdAt: new Date().toISOString(),
    };

    // Insert stake record
    const newStake = await db.insert(stakes)
      .values(insertData)
      .returning();

    return NextResponse.json(newStake[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}