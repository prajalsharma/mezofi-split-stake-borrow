import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, loans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import mezoClient from '@/lib/mezoClient';
import { validateMUSDAmount } from '@/lib/pricing';

export interface BorrowRequest {
  userId: number;
  amountMUSD: number;
  collateralBTC?: number; // Optional: will be calculated if not provided
  durationDays?: number; // Default: 30 days
  purpose?: string; // Optional: 'trip', 'expense', 'general'
}

export interface BorrowResponse {
  success: boolean;
  loanId?: string;
  txHash?: string;
  amountBorrowed?: number;
  collateralRequired?: number;
  interestRate?: number;
  expiryDate?: string;
  error?: string;
}

export interface LoanDetails {
  loanId: string;
  userId: number;
  amountBorrowed: number;
  collateralBTC: number;
  interestRate: number;
  durationDays: number;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'repaid' | 'liquidated';
  outstandingAmount: number;
}

/**
 * Create a new loan
 * POST /api/borrow
 */
export async function POST(req: NextRequest) {
  try {
    const body: BorrowRequest = await req.json();
    
    // Validate required fields
    if (!body.userId || !body.amountMUSD) {
      return NextResponse.json(
        { success: false, error: 'userId and amountMUSD are required' },
        { status: 400 }
      );
    }

    // Validate MUSD amount
    const validation = validateMUSDAmount(body.amountMUSD);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const durationDays = body.durationDays || 30;
    let collateralBTC = body.collateralBTC;

    // Calculate required collateral if not provided
    if (!collateralBTC) {
      const btcRate = await mezoClient.getBTCToMUSDRate();
      // Require 150% collateralization for safety
      collateralBTC = (body.amountMUSD * 1.5) / btcRate;
    }

    // Validate collateral is sufficient (minimum 110% as per Mezo)
    const btcRate = await mezoClient.getBTCToMUSDRate();
    const collateralValue = collateralBTC * btcRate;
    const collateralRatio = collateralValue / body.amountMUSD;
    
    if (collateralRatio < 1.1) {
      return NextResponse.json(
        { success: false, error: `Insufficient collateral. Minimum 110% required, provided ${Math.round(collateralRatio * 100)}%` },
        { status: 400 }
      );
    }

    // Check user's existing loans
    const existingLoans = await mezoClient.getUserLoans(user[0].address);
    const activeLoansCount = existingLoans.length;
    
    if (activeLoansCount >= 5) { // Arbitrary limit
      return NextResponse.json(
        { success: false, error: 'Maximum number of active loans reached' },
        { status: 400 }
      );
    }

    // Execute borrow on Mezo
    const borrowResult = await mezoClient.borrowMUSD({
      userAddress: user[0].address,
      amountMUSD: body.amountMUSD,
      collateralBTC: collateralBTC,
      durationDays: durationDays
    });

    if (!borrowResult.success) {
      return NextResponse.json(
        { success: false, error: 'Mezo borrow transaction failed' },
        { status: 500 }
      );
    }

    // Save loan to database
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    await db.insert(loans).values({
      userId: body.userId,
      amount: borrowResult.amountBorrowed,
      collateralAmount: collateralBTC,
      interestRate: borrowResult.interestRate,
      duration: durationDays,
      status: 'active',
      startDate,
      endDate,
      createdAt: new Date().toISOString()
    });

    // Wait for confirmation
    const confirmed = await mezoClient.waitForConfirmation(borrowResult.txHash);
    if (!confirmed) {
      console.warn(`[BORROW] Transaction ${borrowResult.txHash} not confirmed within timeout`);
    }

    const response: BorrowResponse = {
      success: true,
      loanId: borrowResult.loanId,
      txHash: borrowResult.txHash,
      amountBorrowed: borrowResult.amountBorrowed,
      collateralRequired: collateralBTC,
      interestRate: borrowResult.interestRate,
      expiryDate: endDate
    };

    console.log(`[BORROW] Created loan ${borrowResult.loanId} for user ${user[0].address}: ${body.amountMUSD} MUSD`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('[BORROW] Loan creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get user's loans
 * GET /api/borrow?userId=123
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const loanId = searchParams.get('loanId');

    if (!userId && !loanId) {
      return NextResponse.json(
        { success: false, error: 'userId or loanId is required' },
        { status: 400 }
      );
    }

    if (loanId) {
      // Get specific loan details
      const loan = await db.select()
        .from(loans)
        .where(eq(loans.id, parseInt(loanId)))
        .limit(1);

      if (loan.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Loan not found' },
          { status: 404 }
        );
      }

      // Calculate outstanding amount (simplified - in production would check Mezo)
      const now = new Date();
      const endDate = new Date(loan[0].endDate);
      const isExpired = now > endDate;
      
      const loanDetails: LoanDetails = {
        loanId: loan[0].id.toString(),
        userId: loan[0].userId,
        amountBorrowed: loan[0].amount,
        collateralBTC: loan[0].collateralAmount,
        interestRate: loan[0].interestRate,
        durationDays: loan[0].duration,
        startDate: loan[0].startDate,
        expiryDate: loan[0].endDate,
        status: loan[0].status as 'active' | 'repaid' | 'liquidated',
        outstandingAmount: isExpired ? loan[0].amount * (1 + loan[0].interestRate) : loan[0].amount
      };

      return NextResponse.json({
        success: true,
        loan: loanDetails
      });
    }

    // Get all loans for user
    const userLoans = await db.select()
      .from(loans)
      .where(eq(loans.userId, parseInt(userId!)));

    const loanDetails: LoanDetails[] = userLoans.map(loan => {
      const now = new Date();
      const endDate = new Date(loan.endDate);
      const isExpired = now > endDate;
      
      return {
        loanId: loan.id.toString(),
        userId: loan.userId,
        amountBorrowed: loan.amount,
        collateralBTC: loan.collateralAmount,
        interestRate: loan.interestRate,
        durationDays: loan.duration,
        startDate: loan.startDate,
        expiryDate: loan.endDate,
        status: loan.status as 'active' | 'repaid' | 'liquidated',
        outstandingAmount: isExpired ? loan.amount * (1 + loan.interestRate) : loan.amount
      };
    });

    return NextResponse.json({
      success: true,
      loans: loanDetails,
      totalActiveLoans: loanDetails.filter(l => l.status === 'active').length,
      totalOutstanding: loanDetails
        .filter(l => l.status === 'active')
        .reduce((sum, l) => sum + l.outstandingAmount, 0)
    });

  } catch (error) {
    console.error('[BORROW] Loan retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Repay a loan
 * PUT /api/borrow
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { loanId, repaymentAmountMUSD } = body;

    if (!loanId) {
      return NextResponse.json(
        { success: false, error: 'loanId is required' },
        { status: 400 }
      );
    }

    // Get loan details
    const loan = await db.select()
      .from(loans)
      .where(eq(loans.id, parseInt(loanId)))
      .limit(1);

    if (loan.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      );
    }

    if (loan[0].status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Loan is not active' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await db.select()
      .from(users)
      .where(eq(users.id, loan[0].userId))
      .limit(1);

    // Calculate total repayment amount
    const now = new Date();
    const startDate = new Date(loan[0].startDate);
    const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const dailyInterest = loan[0].interestRate / 365;
    const accruedInterest = loan[0].amount * dailyInterest * daysElapsed;
    const totalOwed = loan[0].amount + accruedInterest;

    const repayAmount = repaymentAmountMUSD || totalOwed;

    // Check user balance
    const balance = await mezoClient.getMUSDBalance(user[0].address);
    if (balance.balance < repayAmount) {
      return NextResponse.json(
        { success: false, error: `Insufficient balance. Required: ${repayAmount}, Available: ${balance.balance}` },
        { status: 400 }
      );
    }

    // TODO: Execute repayment on Mezo
    /*
    const repayResult = await mezoClient.repayLoan({
      loanId: loanId,
      repaymentAmount: repayAmount,
      userAddress: user[0].address
    });
    
    if (!repayResult.success) {
      return NextResponse.json(
        { success: false, error: 'Repayment transaction failed' },
        { status: 500 }
      );
    }
    */

    // Update loan status
    const isFullRepayment = repayAmount >= totalOwed;
    await db.update(loans)
      .set({
        status: isFullRepayment ? 'repaid' : 'active'
      })
      .where(eq(loans.id, parseInt(loanId)));

    console.log(`[BORROW] ${isFullRepayment ? 'Fully repaid' : 'Partially repaid'} loan ${loanId}: ${repayAmount} MUSD`);

    return NextResponse.json({
      success: true,
      repaidAmount: repayAmount,
      remainingBalance: isFullRepayment ? 0 : totalOwed - repayAmount,
      fullyRepaid: isFullRepayment
    });

  } catch (error) {
    console.error('[BORROW] Loan repayment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}