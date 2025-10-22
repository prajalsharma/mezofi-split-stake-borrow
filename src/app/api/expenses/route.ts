import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, groups, expenses, expenseSplits, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { convertFiatToMUSD, validateFiatAmount } from '@/lib/pricing';

export interface ExpenseUploadRequest {
  groupId: number;
  uploadedById: number;
  imageBase64?: string; // Base64 encoded receipt image
  imageUrl?: string; // Alternative: URL to uploaded image
  manualData?: {
    merchant: string;
    date: string;
    totalAmount: number;
    currency: string;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
  // Legacy fields for backward compatibility
  description?: string;
  amount?: number;
  paidById?: number;
  category?: string;
  date?: string;
  splitType?: string;
  receiptUrl?: string;
  splits?: Array<{
    userId: number;
    amount?: number;
    percentage?: number;
  }>;
}

export interface ExpenseProcessResponse {
  success: boolean;
  expenseId?: number;
  extractedData?: {
    merchant: string;
    date: string;
    totalAmountFiat: number;
    totalAmountMUSD: number;
    currency: string;
    confidence: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
  error?: string;
  // Legacy fields for backward compatibility
  id?: number;
  splits?: any[];
}

export interface ExpenseSplitRequest {
  expenseId: number;
  splitType: 'equal' | 'percentage' | 'amount';
  splits: Array<{
    userId: number;
    amount?: number; // For 'amount' split type
    percentage?: number; // For 'percentage' split type
  }>;
}

/**
 * Upload and process expense receipt OR create expense (legacy)
 * POST /api/expenses
 */
export async function POST(req: NextRequest) {
  try {
    const body: ExpenseUploadRequest = await req.json();
    
    // Check if this is a new OCR-based expense upload
    if (body.uploadedById && (body.imageBase64 || body.imageUrl || body.manualData)) {
      return handleOCRExpenseUpload(body);
    }
    
    // Legacy expense creation
    return handleLegacyExpenseCreation(body);

  } catch (error) {
    console.error('[EXPENSES] Expense processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle new OCR-based expense upload
 */
async function handleOCRExpenseUpload(body: ExpenseUploadRequest) {
  if (!body.groupId || !body.uploadedById) {
    return NextResponse.json(
      { success: false, error: 'groupId and uploadedById are required' },
      { status: 400 }
    );
  }

  // Validate user is member of the group
  const membership = await db.select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, body.groupId),
        eq(groupMembers.userId, body.uploadedById)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json(
      { success: false, error: 'User is not a member of this group' },
      { status: 403 }
    );
  }

  let extractedData;
  
  if (body.manualData) {
    // Use manually entered data
    const validation = validateFiatAmount(body.manualData.totalAmount, body.manualData.currency);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const conversion = await convertFiatToMUSD(body.manualData.totalAmount, body.manualData.currency);
    
    extractedData = {
      merchant: body.manualData.merchant,
      date: body.manualData.date,
      totalAmountFiat: body.manualData.totalAmount,
      totalAmountMUSD: conversion.amountMUSD,
      currency: body.manualData.currency,
      confidence: 1.0, // Manual entry is 100% confident
      items: body.manualData.items || []
    };
  } else if (body.imageBase64 || body.imageUrl) {
    // Process receipt image with OCR
    extractedData = await processReceiptImage(body.imageBase64, body.imageUrl);
    
    if (!extractedData) {
      return NextResponse.json(
        { success: false, error: 'Failed to process receipt image' },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { success: false, error: 'Either imageBase64, imageUrl, or manualData must be provided' },
      { status: 400 }
    );
  }

  // Create expense record
  const [newExpense] = await db.insert(expenses).values({
    groupId: body.groupId,
    description: `${extractedData.merchant} - ${extractedData.date}`,
    amount: extractedData.totalAmountMUSD, // Store in MUSD
    paidById: body.uploadedById,
    category: categorizeExpense(extractedData.merchant),
    receiptUrl: body.imageUrl,
    date: extractedData.date,
    splitType: 'pending', // Will be updated when splits are created
    createdAt: new Date().toISOString()
  }).returning();

  console.log(`[EXPENSES] Created expense ${newExpense.id}: ${extractedData.totalAmountMUSD} MUSD from ${extractedData.merchant}`);

  const response: ExpenseProcessResponse = {
    success: true,
    expenseId: newExpense.id,
    extractedData
  };

  return NextResponse.json(response);
}

/**
 * Handle legacy expense creation for backward compatibility
 */
async function handleLegacyExpenseCreation(body: any) {
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
}

/**
 * Get expenses for a group or user
 * GET /api/expenses?groupId=123 or GET /api/expenses?userId=456
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');
    const userId = searchParams.get('userId');
    const expenseId = searchParams.get('expenseId');

    if (expenseId) {
      // Get specific expense with splits
      const expense = await db.select({
        id: expenses.id,
        groupId: expenses.groupId,
        description: expenses.description,
        amount: expenses.amount,
        paidById: expenses.paidById,
        paidByName: users.name,
        category: expenses.category,
        receiptUrl: expenses.receiptUrl,
        date: expenses.date,
        splitType: expenses.splitType,
        createdAt: expenses.createdAt
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.paidById, users.id))
      .where(eq(expenses.id, parseInt(expenseId)))
      .limit(1);

      if (expense.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Expense not found' },
          { status: 404 }
        );
      }

      // Get expense splits
      const splits = await db.select({
        userId: expenseSplits.userId,
        userName: users.name,
        amount: expenseSplits.amount,
        percentage: expenseSplits.percentage,
        paid: expenseSplits.paid,
        paidAt: expenseSplits.paidAt
      })
      .from(expenseSplits)
      .innerJoin(users, eq(expenseSplits.userId, users.id))
      .where(eq(expenseSplits.expenseId, parseInt(expenseId)));

      return NextResponse.json({
        success: true,
        expense: {
          ...expense[0],
          splits
        }
      });
    }

    if (groupId) {
      // Get all expenses for a group
      const groupExpenses = await db.select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        paidById: expenses.paidById,
        paidByName: users.name,
        category: expenses.category,
        date: expenses.date,
        splitType: expenses.splitType,
        createdAt: expenses.createdAt
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.paidById, users.id))
      .where(eq(expenses.groupId, parseInt(groupId)))
      .orderBy(expenses.createdAt);

      return NextResponse.json({
        success: true,
        expenses: groupExpenses
      });
    }

    if (userId) {
      // Get expenses paid by user or owed by user
      const userExpenses = await db.select({
        id: expenses.id,
        groupId: expenses.groupId,
        description: expenses.description,
        amount: expenses.amount,
        paidById: expenses.paidById,
        category: expenses.category,
        date: expenses.date,
        owedAmount: expenseSplits.amount,
        paid: expenseSplits.paid
      })
      .from(expenseSplits)
      .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
      .where(eq(expenseSplits.userId, parseInt(userId)));

      return NextResponse.json({
        success: true,
        expenses: userExpenses
      });
    }

    return NextResponse.json(
      { success: false, error: 'groupId, userId, or expenseId is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[EXPENSES] Expense retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create expense splits
 * PUT /api/expenses
 */
export async function PUT(req: NextRequest) {
  try {
    const body: ExpenseSplitRequest = await req.json();
    
    if (!body.expenseId || !body.splitType || !body.splits) {
      return NextResponse.json(
        { success: false, error: 'expenseId, splitType, and splits are required' },
        { status: 400 }
      );
    }

    // Get expense details
    const expense = await db.select()
      .from(expenses)
      .where(eq(expenses.id, body.expenseId))
      .limit(1);

    if (expense.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

    const totalAmount = expense[0].amount;
    let calculatedSplits: Array<{
      userId: number;
      amount: number;
      percentage?: number;
    }> = [];

    // Calculate split amounts based on type
    switch (body.splitType) {
      case 'equal':
        const equalAmount = totalAmount / body.splits.length;
        calculatedSplits = body.splits.map(split => ({
          userId: split.userId,
          amount: equalAmount,
          percentage: Math.round((equalAmount / totalAmount) * 100)
        }));
        break;

      case 'percentage':
        const totalPercentage = body.splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return NextResponse.json(
            { success: false, error: 'Percentages must total 100%' },
            { status: 400 }
          );
        }
        calculatedSplits = body.splits.map(split => ({
          userId: split.userId,
          amount: (totalAmount * (split.percentage || 0)) / 100,
          percentage: split.percentage
        }));
        break;

      case 'amount':
        const totalSplitAmount = body.splits.reduce((sum, split) => sum + (split.amount || 0), 0);
        if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
          return NextResponse.json(
            { success: false, error: 'Split amounts must total the expense amount' },
            { status: 400 }
          );
        }
        calculatedSplits = body.splits.map(split => ({
          userId: split.userId,
          amount: split.amount || 0,
          percentage: Math.round(((split.amount || 0) / totalAmount) * 100)
        }));
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid split type' },
          { status: 400 }
        );
    }

    // Delete existing splits
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, body.expenseId));

    // Create new splits
    const splitInserts = calculatedSplits.map(split => ({
      expenseId: body.expenseId,
      userId: split.userId,
      amount: split.amount,
      percentage: split.percentage || null,
      paid: false,
      paidAt: null
    }));

    await db.insert(expenseSplits).values(splitInserts);

    // Update expense split type
    await db.update(expenses)
      .set({ splitType: body.splitType })
      .where(eq(expenses.id, body.expenseId));

    console.log(`[EXPENSES] Created ${calculatedSplits.length} splits for expense ${body.expenseId}`);

    return NextResponse.json({
      success: true,
      splits: calculatedSplits,
      message: 'Expense splits created successfully'
    });

  } catch (error) {
    console.error('[EXPENSES] Expense split error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process receipt image with OCR
 */
async function processReceiptImage(imageBase64?: string, imageUrl?: string) {
  // TODO: Implement actual OCR processing
  /*
  // Example using Google Vision API or Tesseract.js
  try {
    let imageBuffer: Buffer;
    
    if (imageBase64) {
      imageBuffer = Buffer.from(imageBase64, 'base64');
    } else if (imageUrl) {
      const response = await fetch(imageUrl);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      return null;
    }

    // Google Vision API example
    const vision = new ImageAnnotatorClient();
    const [result] = await vision.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return null;
    }

    const fullText = detections[0].description || '';
    
    // Parse receipt data using regex patterns
    const merchantMatch = fullText.match(/^([A-Z\s]+)/m);
    const totalMatch = fullText.match(/TOTAL[:\s]*\$?([0-9,.]+)/i);
    const dateMatch = fullText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    
    const merchant = merchantMatch ? merchantMatch[1].trim() : 'Unknown Merchant';
    const totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/[,$]/g, '')) : 0;
    const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
    
    // Convert to MUSD
    const conversion = await convertFiatToMUSD(totalAmount, 'USD');
    
    return {
      merchant,
      date,
      totalAmountFiat: totalAmount,
      totalAmountMUSD: conversion.amountMUSD,
      currency: 'USD',
      confidence: 0.8, // OCR confidence score
      items: [] // TODO: Parse line items
    };
    
  } catch (error) {
    console.error('[EXPENSES] OCR processing error:', error);
    return null;
  }
  */

  // Mock OCR response for development
  console.log('[EXPENSES] Processing receipt image with OCR (mock)');
  
  // Simulate OCR extraction
  const mockData = {
    merchant: 'Sample Restaurant',
    date: new Date().toISOString(),
    totalAmountFiat: 45.67,
    totalAmountMUSD: 45.67, // Assuming 1:1 for mock
    currency: 'USD',
    confidence: 0.85,
    items: [
      { description: 'Burger', quantity: 2, unitPrice: 12.50 },
      { description: 'Fries', quantity: 1, unitPrice: 5.99 },
      { description: 'Drinks', quantity: 2, unitPrice: 7.34 }
    ]
  };

  return mockData;
}

/**
 * Categorize expense based on merchant name
 */
function categorizeExpense(merchant: string): string {
  const merchantLower = merchant.toLowerCase();
  
  if (merchantLower.includes('restaurant') || merchantLower.includes('cafe') || merchantLower.includes('food')) {
    return 'Food & Dining';
  }
  if (merchantLower.includes('gas') || merchantLower.includes('fuel') || merchantLower.includes('shell') || merchantLower.includes('exxon')) {
    return 'Transportation';
  }
  if (merchantLower.includes('hotel') || merchantLower.includes('lodge') || merchantLower.includes('inn')) {
    return 'Accommodation';
  }
  if (merchantLower.includes('grocery') || merchantLower.includes('supermarket') || merchantLower.includes('market')) {
    return 'Groceries';
  }
  if (merchantLower.includes('entertainment') || merchantLower.includes('movie') || merchantLower.includes('theater')) {
    return 'Entertainment';
  }
  
  return 'Other';
}