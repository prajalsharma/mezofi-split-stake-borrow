import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses, expenseSplits } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, description, amount, paidById, category, date, splitType, receiptUrl, splits } = body;

    // Validate required fields
    if (!groupId || typeof groupId !== 'number') {
      return NextResponse.json({ 
        error: "groupId is required and must be a number",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json({ 
        error: "description is required and must be a non-empty string",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ 
        error: "amount is required and must be a number",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        error: "amount must be a positive number",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!paidById || typeof paidById !== 'number') {
      return NextResponse.json({ 
        error: "paidById is required and must be a number",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json({ 
        error: "category is required and must be a non-empty string",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ 
        error: "date is required and must be a string",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!splitType || typeof splitType !== 'string') {
      return NextResponse.json({ 
        error: "splitType is required and must be a string",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT'];
    if (!validSplitTypes.includes(splitType)) {
      return NextResponse.json({ 
        error: "splitType must be one of: EQUAL, PERCENTAGE, or EXACT",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    // Validate splits if provided
    if (splits !== undefined) {
      if (!Array.isArray(splits)) {
        return NextResponse.json({ 
          error: "splits must be an array",
          code: "VALIDATION_ERROR" 
        }, { status: 400 });
      }

      if (splits.length === 0) {
        return NextResponse.json({ 
          error: "splits array cannot be empty when provided",
          code: "VALIDATION_ERROR" 
        }, { status: 400 });
      }

      // Validate based on splitType
      if (splitType === 'EQUAL') {
        for (const split of splits) {
          if (!split.userId || typeof split.userId !== 'number') {
            return NextResponse.json({ 
              error: "Each split must have a valid userId for EQUAL split type",
              code: "VALIDATION_ERROR" 
            }, { status: 400 });
          }
        }
      } else if (splitType === 'PERCENTAGE') {
        let totalPercentage = 0;
        for (const split of splits) {
          if (!split.userId || typeof split.userId !== 'number') {
            return NextResponse.json({ 
              error: "Each split must have a valid userId for PERCENTAGE split type",
              code: "VALIDATION_ERROR" 
            }, { status: 400 });
          }
          if (split.percentage === undefined || typeof split.percentage !== 'number') {
            return NextResponse.json({ 
              error: "Each split must have a valid percentage for PERCENTAGE split type",
              code: "VALIDATION_ERROR" 
            }, { status: 400 });
          }
          if (split.percentage <= 0) {
            return NextResponse.json({ 
              error: "Percentage must be positive",
              code: "VALIDATION_ERROR" 
            }, { status: 400 });
          }
          totalPercentage += split.percentage;
        }
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return NextResponse.json({ 
            error: "Split percentages must sum to 100",
            code: "VALIDATION_ERROR" 
          }, { status: 400 });
        }
      } else if (splitType === 'EXACT') {
        let totalAmount = 0;
        for (const split of splits) {
          if (!split.userId || typeof split.userId !== 'number') {
            return NextResponse.json({ 
              error: "Each split must have a valid userId for EXACT split type",
              code: "VALIDATION_ERROR" 
            }, { status: 400 });
          }
          if (split.amount === undefined || typeof split.amount !== 'number') {
            return NextResponse.json({ 
              error: "Each split must have a valid amount for EXACT split type",
              code: "VALIDATION_ERROR" 
            }, { status: 400 });
          }
          if (split.amount <= 0) {
            return NextResponse.json({ 
              error: "Split amount must be positive",
              code: "VALIDATION_ERROR" 
            }, { status: 400 });
          }
          totalAmount += split.amount;
        }
        if (Math.abs(totalAmount - amount) > 0.01) {
          return NextResponse.json({ 
            error: "Split amounts must sum to total expense amount",
            code: "VALIDATION_ERROR" 
          }, { status: 400 });
        }
      }
    }

    // Create expense record
    const newExpense = await db.insert(expenses)
      .values({
        groupId,
        description: description.trim(),
        amount,
        paidById,
        category: category.trim(),
        receiptUrl: receiptUrl?.trim() || null,
        date,
        splitType,
        createdAt: new Date().toISOString()
      })
      .returning();

    const createdExpense = newExpense[0];

    // Create expense splits if provided
    let createdSplits: any[] = [];
    if (splits && splits.length > 0) {
      const splitRecords = [];

      for (const split of splits) {
        let splitAmount: number;
        let splitPercentage: number | null = null;

        if (splitType === 'EQUAL') {
          splitAmount = amount / splits.length;
        } else if (splitType === 'PERCENTAGE') {
          splitAmount = amount * (split.percentage / 100);
          splitPercentage = split.percentage;
        } else { // EXACT
          splitAmount = split.amount;
        }

        splitRecords.push({
          expenseId: createdExpense.id,
          userId: split.userId,
          amount: splitAmount,
          percentage: splitPercentage,
          paid: false,
          paidAt: null
        });
      }

      createdSplits = await db.insert(expenseSplits)
        .values(splitRecords)
        .returning();
    }

    // Return expense with splits
    return NextResponse.json({
      ...createdExpense,
      splits: createdSplits
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}