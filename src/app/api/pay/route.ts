import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, expenseSplits } from '@/db/schema';
import { eq } from 'drizzle-orm';
import mezoClient from '@/lib/mezoClient';
import { convertFiatToMUSD, validateFiatAmount, validateMUSDAmount } from '@/lib/pricing';

export interface PaymentRequest {
  fromUserId: number;
  toUserId: number;
  amountFiat?: number;
  amountMUSD?: number;
  fiatCurrency?: string;
  memo?: string;
  expenseId?: number; // Optional: link to expense split
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  txHash?: string;
  amountMUSD: number;
  amountFiat?: number;
  currency?: string;
  autoBorrowed?: boolean;
  borrowAmount?: number;
  message?: string;
  error?: string;
}

/**
 * Process QR code payment
 * POST /api/pay
 */
export async function POST(req: NextRequest) {
  try {
    const body: PaymentRequest = await req.json();
    
    // Validate required fields
    if (!body.fromUserId || !body.toUserId) {
      return NextResponse.json(
        { success: false, error: 'fromUserId and toUserId are required' },
        { status: 400 }
      );
    }

    // Validate users exist
    const [fromUser, toUser] = await Promise.all([
      db.select().from(users).where(eq(users.id, body.fromUserId)).limit(1),
      db.select().from(users).where(eq(users.id, body.toUserId)).limit(1)
    ]);

    if (fromUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      );
    }

    if (toUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found' },
        { status: 404 }
      );
    }

    let finalAmountMUSD: number;
    let finalAmountFiat: number | undefined;
    let currency: string | undefined;

    // Determine final amounts
    if (body.amountMUSD) {
      // Direct MUSD payment
      const validation = validateMUSDAmount(body.amountMUSD);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }
      finalAmountMUSD = body.amountMUSD;
    } else if (body.amountFiat) {
      // Fiat payment - convert to MUSD
      currency = body.fiatCurrency || 'USD';
      const fiatValidation = validateFiatAmount(body.amountFiat, currency);
      if (!fiatValidation.valid) {
        return NextResponse.json(
          { success: false, error: fiatValidation.error },
          { status: 400 }
        );
      }

      const conversion = await convertFiatToMUSD(body.amountFiat, currency);
      finalAmountMUSD = conversion.amountMUSD;
      finalAmountFiat = body.amountFiat;
    } else {
      return NextResponse.json(
        { success: false, error: 'Either amountMUSD or amountFiat must be provided' },
        { status: 400 }
      );
    }

    // Check sender's MUSD balance
    const senderBalance = await mezoClient.getMUSDBalance(fromUser[0].address);
    let autoBorrowed = false;
    let borrowAmount = 0;

    // Auto-borrow if insufficient balance
    if (senderBalance.balance < finalAmountMUSD) {
      const shortfall = finalAmountMUSD - senderBalance.balance;
      
      console.log(`[PAY] Insufficient balance. Need: ${finalAmountMUSD}, Have: ${senderBalance.balance}, Shortfall: ${shortfall}`);
      
      try {
        // Calculate required BTC collateral (assume 150% collateralization)
        const btcRate = await mezoClient.getBTCToMUSDRate();
        const requiredCollateral = (shortfall * 1.5) / btcRate;
        
        const borrowResult = await mezoClient.borrowMUSD({
          userAddress: fromUser[0].address,
          amountMUSD: shortfall + 10, // Borrow slightly more for buffer
          collateralBTC: requiredCollateral,
          durationDays: 30 // Default 30-day loan
        });

        if (!borrowResult.success) {
          return NextResponse.json(
            { success: false, error: 'Failed to auto-borrow funds' },
            { status: 400 }
          );
        }

        autoBorrowed = true;
        borrowAmount = borrowResult.amountBorrowed;
        
        // Save loan record to database
        await db.insert(require('@/db/schema').loans).values({
          userId: body.fromUserId,
          amount: borrowResult.amountBorrowed,
          collateralAmount: requiredCollateral,
          interestRate: borrowResult.interestRate,
          duration: 30,
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        });

        console.log(`[PAY] Auto-borrowed ${borrowAmount} MUSD for user ${fromUser[0].address}`);
      } catch (error) {
        console.error('[PAY] Auto-borrow failed:', error);
        return NextResponse.json(
          { success: false, error: 'Insufficient balance and auto-borrow failed' },
          { status: 400 }
        );
      }
    }

    // Perform the MUSD transfer
    const transferResult = await mezoClient.transferMUSD({
      fromAddress: fromUser[0].address,
      toAddress: toUser[0].address,
      amountMUSD: finalAmountMUSD,
      memo: body.memo
    });

    if (!transferResult.success) {
      return NextResponse.json(
        { success: false, error: 'Transfer failed' },
        { status: 500 }
      );
    }

    // Generate transaction ID
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // If this payment is for an expense split, mark it as paid
    if (body.expenseId) {
      try {
        await db.update(expenseSplits)
          .set({
            paid: true,
            paidAt: new Date().toISOString()
          })
          .where(
            eq(expenseSplits.expenseId, body.expenseId) &&
            eq(expenseSplits.userId, body.fromUserId)
          );
      } catch (error) {
        console.warn('[PAY] Failed to update expense split:', error);
      }
    }

    // TODO: Add transaction record to database
    /*
    await db.insert(transactions).values({
      id: transactionId,
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
      amountMUSD: finalAmountMUSD,
      amountFiat: finalAmountFiat,
      currency: currency,
      txHash: transferResult.txHash,
      memo: body.memo,
      status: 'completed',
      createdAt: new Date().toISOString()
    });
    */

    // TODO: Send notifications to both users
    /*
    await notifyUsers([
      {
        userId: body.fromUserId,
        message: `Payment sent: ${finalAmountMUSD} MUSD to ${toUser[0].name}`
      },
      {
        userId: body.toUserId,
        message: `Payment received: ${finalAmountMUSD} MUSD from ${fromUser[0].name}`
      }
    ]);
    */

    const response: PaymentResponse = {
      success: true,
      transactionId,
      txHash: transferResult.txHash,
      amountMUSD: finalAmountMUSD,
      amountFiat: finalAmountFiat,
      currency,
      autoBorrowed,
      borrowAmount: autoBorrowed ? borrowAmount : undefined,
      message: autoBorrowed 
        ? `Payment successful. Auto-borrowed ${borrowAmount} MUSD to cover transaction.`
        : 'Payment successful'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[PAY] Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate QR code payment data
 * GET /api/pay/qr?userId=123&amount=100&currency=USD
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency') || 'USD';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate QR code data
    const qrData = {
      version: '1.0',
      type: 'mezofi_pay',
      userId: parseInt(userId),
      userName: user[0].name,
      userAddress: user[0].address,
      defaultAmountFiat: amount ? parseFloat(amount) : undefined,
      fiatCurrency: currency,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      qrData,
      qrString: JSON.stringify(qrData)
    });

  } catch (error) {
    console.error('[PAY] QR generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}