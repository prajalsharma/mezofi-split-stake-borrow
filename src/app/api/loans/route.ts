import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const userIdParam = searchParams.get('userId');
    const statusParam = searchParams.get('status');

    let query = db
      .select({
        id: loans.id,
        userId: loans.userId,
        amount: loans.amount,
        collateralAmount: loans.collateralAmount,
        interestRate: loans.interestRate,
        duration: loans.duration,
        status: loans.status,
        startDate: loans.startDate,
        endDate: loans.endDate,
        createdAt: loans.createdAt,
        user: {
          id: users.id,
          name: users.name,
          address: users.address,
          email: users.email,
        },
      })
      .from(loans)
      .leftJoin(users, eq(loans.userId, users.id));

    const conditions = [];

    if (userIdParam) {
      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        return NextResponse.json(
          { error: 'Invalid userId parameter', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(loans.userId, userId));
    }

    if (statusParam) {
      const validStatuses = ['ACTIVE', 'PAID', 'DEFAULTED'];
      if (!validStatuses.includes(statusParam)) {
        return NextResponse.json(
          { 
            error: 'Invalid status parameter. Must be one of: ACTIVE, PAID, DEFAULTED', 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(loans.status, statusParam));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      amount, 
      collateralAmount, 
      interestRate, 
      duration, 
      startDate,
      status 
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    if (!collateralAmount) {
      return NextResponse.json(
        { error: 'collateralAmount is required', code: 'MISSING_COLLATERAL_AMOUNT' },
        { status: 400 }
      );
    }

    if (!interestRate && interestRate !== 0) {
      return NextResponse.json(
        { error: 'interestRate is required', code: 'MISSING_INTEREST_RATE' },
        { status: 400 }
      );
    }

    if (!duration) {
      return NextResponse.json(
        { error: 'duration is required', code: 'MISSING_DURATION' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'startDate is required', code: 'MISSING_START_DATE' },
        { status: 400 }
      );
    }

    // Validate types and values
    if (typeof userId !== 'number' || isNaN(userId)) {
      return NextResponse.json(
        { error: 'userId must be a valid number', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    if (typeof collateralAmount !== 'number' || isNaN(collateralAmount) || collateralAmount <= 0) {
      return NextResponse.json(
        { error: 'collateralAmount must be a positive number', code: 'INVALID_COLLATERAL_AMOUNT' },
        { status: 400 }
      );
    }

    if (typeof interestRate !== 'number' || isNaN(interestRate) || interestRate < 0) {
      return NextResponse.json(
        { error: 'interestRate must be a positive number', code: 'INVALID_INTEREST_RATE' },
        { status: 400 }
      );
    }

    if (typeof duration !== 'number' || isNaN(duration) || duration <= 0 || !Number.isInteger(duration)) {
      return NextResponse.json(
        { error: 'duration must be a positive integer', code: 'INVALID_DURATION' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['ACTIVE', 'PAID', 'DEFAULTED'];
    const loanStatus = status || 'ACTIVE';
    if (!validStatuses.includes(loanStatus)) {
      return NextResponse.json(
        { 
          error: 'status must be one of: ACTIVE, PAID, DEFAULTED', 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Calculate endDate from startDate + duration days
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'startDate must be a valid date', code: 'INVALID_START_DATE' },
        { status: 400 }
      );
    }

    const end = new Date(start);
    end.setDate(end.getDate() + duration);
    const endDate = end.toISOString();

    // Verify user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create loan
    const newLoan = await db
      .insert(loans)
      .values({
        userId,
        amount,
        collateralAmount,
        interestRate,
        duration,
        startDate,
        endDate,
        status: loanStatus,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newLoan[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}