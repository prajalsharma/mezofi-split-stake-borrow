import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, groups, groupMembers, stakes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import mezoClient from '@/lib/mezoClient';
import { validateMUSDAmount } from '@/lib/pricing';

export interface TripCreateRequest {
  name: string;
  description?: string;
  createdById: number;
  members?: number[]; // User IDs to invite
  stakingEnabled?: boolean;
  targetPoolAmount?: number; // MUSD
  yieldVaultId?: string;
}

export interface TripDepositRequest {
  tripId: number;
  userId: number;
  amountMUSD: number;
  stakeType: 'musd' | 'btc_borrow'; // Direct MUSD or borrow against BTC
  btcCollateral?: number; // Required if stakeType is 'btc_borrow'
}

export interface TripSettlementRequest {
  tripId: number;
  initiatedById: number;
  distributionMethod: 'equal' | 'proportional'; // Equal split or based on stake amounts
  expenses?: Array<{
    description: string;
    amountMUSD: number;
    paidById: number;
  }>;
}

export interface TripResponse {
  success: boolean;
  trip?: {
    id: number;
    name: string;
    description: string;
    createdBy: string;
    members: Array<{
      userId: number;
      name: string;
      role: string;
      stakeAmount: number;
      joinedAt: string;
    }>;
    totalStaked: number;
    vaultDeposit?: {
      poolId: string;
      amountMUSD: number;
      currentYield: number;
    };
    status: 'active' | 'settled';
    createdAt: string;
  };
  error?: string;
}

/**
 * Create a new trip (group)
 * POST /api/trips
 */
export async function POST(req: NextRequest) {
  try {
    const body: TripCreateRequest = await req.json();
    
    if (!body.name || !body.createdById) {
      return NextResponse.json(
        { success: false, error: 'name and createdById are required' },
        { status: 400 }
      );
    }

    // Validate creator exists
    const creator = await db.select().from(users).where(eq(users.id, body.createdById)).limit(1);
    if (creator.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Create the group/trip
    const [newTrip] = await db.insert(groups).values({
      name: body.name,
      description: body.description || '',
      createdById: body.createdById,
      createdAt: new Date().toISOString()
    }).returning();

    // Add creator as admin
    await db.insert(groupMembers).values({
      groupId: newTrip.id,
      userId: body.createdById,
      role: 'admin',
      joinedAt: new Date().toISOString()
    });

    // Add invited members
    if (body.members && body.members.length > 0) {
      const memberInserts = body.members
        .filter(memberId => memberId !== body.createdById) // Don't add creator twice
        .map(memberId => ({
          groupId: newTrip.id,
          userId: memberId,
          role: 'member',
          joinedAt: new Date().toISOString()
        }));

      if (memberInserts.length > 0) {
        await db.insert(groupMembers).values(memberInserts);
      }
    }

    console.log(`[TRIPS] Created trip '${body.name}' with ID ${newTrip.id}`);

    return NextResponse.json({
      success: true,
      tripId: newTrip.id,
      name: newTrip.name,
      message: 'Trip created successfully'
    });

  } catch (error) {
    console.error('[TRIPS] Trip creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get trip details or list user's trips
 * GET /api/trips?tripId=123 or GET /api/trips?userId=456
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const tripId = searchParams.get('tripId');
    const userId = searchParams.get('userId');

    if (tripId) {
      // Get specific trip details
      const trip = await db.select()
        .from(groups)
        .where(eq(groups.id, parseInt(tripId)))
        .limit(1);

      if (trip.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Trip not found' },
          { status: 404 }
        );
      }

      // Get trip members with their stakes
      const members = await db.select({
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        userName: users.name,
        stakeAmount: stakes.amount,
        stakeActive: stakes.active
      })
      .from(groupMembers)
      .leftJoin(users, eq(groupMembers.userId, users.id))
      .leftJoin(stakes, and(
        eq(stakes.groupId, parseInt(tripId)),
        eq(stakes.userId, groupMembers.userId),
        eq(stakes.active, true)
      ))
      .where(eq(groupMembers.groupId, parseInt(tripId)));

      const totalStaked = members.reduce((sum, member) => sum + (member.stakeAmount || 0), 0);

      const tripResponse: TripResponse = {
        success: true,
        trip: {
          id: trip[0].id,
          name: trip[0].name,
          description: trip[0].description || '',
          createdBy: trip[0].createdById.toString(),
          members: members.map(m => ({
            userId: m.userId,
            name: m.userName || 'Unknown',
            role: m.role,
            stakeAmount: m.stakeAmount || 0,
            joinedAt: m.joinedAt
          })),
          totalStaked,
          status: 'active', // TODO: implement settlement logic
          createdAt: trip[0].createdAt
        }
      };

      return NextResponse.json(tripResponse);
    }

    if (userId) {
      // Get user's trips
      const userTrips = await db.select({
        tripId: groups.id,
        tripName: groups.name,
        description: groups.description,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        createdAt: groups.createdAt
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, parseInt(userId)));

      return NextResponse.json({
        success: true,
        trips: userTrips
      });
    }

    return NextResponse.json(
      { success: false, error: 'tripId or userId is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[TRIPS] Trip retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Deposit stake to trip
 * PUT /api/trips/deposit
 */
export async function PUT(req: NextRequest) {
  try {
    const body: TripDepositRequest = await req.json();
    
    if (!body.tripId || !body.userId || !body.amountMUSD || !body.stakeType) {
      return NextResponse.json(
        { success: false, error: 'tripId, userId, amountMUSD, and stakeType are required' },
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

    // Validate user is member of the trip
    const membership = await db.select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, body.tripId),
          eq(groupMembers.userId, body.userId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of this trip' },
        { status: 403 }
      );
    }

    // Get user details
    const user = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
    
    let finalAmountMUSD = body.amountMUSD;
    let borrowTxHash: string | undefined;

    // Handle stake type
    if (body.stakeType === 'btc_borrow') {
      if (!body.btcCollateral) {
        return NextResponse.json(
          { success: false, error: 'btcCollateral is required for btc_borrow stake type' },
          { status: 400 }
        );
      }

      // Borrow MUSD against BTC collateral
      const borrowResult = await mezoClient.borrowMUSD({
        userAddress: user[0].address,
        amountMUSD: body.amountMUSD,
        collateralBTC: body.btcCollateral,
        durationDays: 90 // Longer duration for trip stakes
      });

      if (!borrowResult.success) {
        return NextResponse.json(
          { success: false, error: 'Failed to borrow MUSD against BTC collateral' },
          { status: 500 }
        );
      }

      finalAmountMUSD = borrowResult.amountBorrowed;
      borrowTxHash = borrowResult.txHash;

      // Save the loan record
      await db.insert(require('@/db/schema').loans).values({
        userId: body.userId,
        amount: borrowResult.amountBorrowed,
        collateralAmount: body.btcCollateral,
        interestRate: borrowResult.interestRate,
        duration: 90,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
    } else {
      // Direct MUSD stake - check user balance
      const balance = await mezoClient.getMUSDBalance(user[0].address);
      if (balance.balance < body.amountMUSD) {
        return NextResponse.json(
          { success: false, error: 'Insufficient MUSD balance' },
          { status: 400 }
        );
      }
    }

    // Create stake record
    const stakeEndDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default
    
    await db.insert(stakes).values({
      groupId: body.tripId,
      userId: body.userId,
      amount: finalAmountMUSD,
      startDate: new Date().toISOString(),
      endDate: stakeEndDate.toISOString(),
      rewardRate: 0.05, // 5% APY default
      claimedRewards: 0,
      active: true,
      createdAt: new Date().toISOString()
    });

    // TODO: Optionally deposit to yield vault
    /*
    if (yieldVaultId) {
      const vaultResult = await mezoClient.depositToVault({
        poolId: yieldVaultId,
        amountMUSD: finalAmountMUSD,
        expectedYield: 0.08 // 8% APY
      });
      
      if (vaultResult.success) {
        console.log(`[TRIPS] Deposited ${finalAmountMUSD} MUSD to vault ${yieldVaultId}`);
      }
    }
    */

    console.log(`[TRIPS] User ${body.userId} staked ${finalAmountMUSD} MUSD in trip ${body.tripId}`);

    return NextResponse.json({
      success: true,
      stakedAmount: finalAmountMUSD,
      stakeType: body.stakeType,
      borrowTxHash,
      message: 'Stake deposited successfully'
    });

  } catch (error) {
    console.error('[TRIPS] Stake deposit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Settle trip and distribute funds
 * DELETE /api/trips (using DELETE for settlement)
 */
export async function DELETE(req: NextRequest) {
  try {
    const body: TripSettlementRequest = await req.json();
    
    if (!body.tripId || !body.initiatedById) {
      return NextResponse.json(
        { success: false, error: 'tripId and initiatedById are required' },
        { status: 400 }
      );
    }

    // Validate initiator is admin of the trip
    const membership = await db.select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, body.tripId),
          eq(groupMembers.userId, body.initiatedById)
        )
      )
      .limit(1);

    if (membership.length === 0 || membership[0].role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only trip admins can initiate settlement' },
        { status: 403 }
      );
    }

    // Get all active stakes for this trip
    const tripStakes = await db.select({
      userId: stakes.userId,
      userAddress: users.address,
      userName: users.name,
      stakeAmount: stakes.amount,
      rewardRate: stakes.rewardRate,
      startDate: stakes.startDate
    })
    .from(stakes)
    .innerJoin(users, eq(stakes.userId, users.id))
    .where(
      and(
        eq(stakes.groupId, body.tripId),
        eq(stakes.active, true)
      )
    );

    if (tripStakes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active stakes found for this trip' },
        { status: 400 }
      );
    }

    const totalStaked = tripStakes.reduce((sum, stake) => sum + stake.stakeAmount, 0);
    
    // Calculate yields (simplified - in production would query Mezo vaults)
    const now = new Date();
    let totalYield = 0;
    const stakeRewards = tripStakes.map(stake => {
      const stakeDays = Math.floor((now.getTime() - new Date(stake.startDate).getTime()) / (24 * 60 * 60 * 1000));
      const dailyRate = stake.rewardRate / 365;
      const reward = stake.stakeAmount * dailyRate * stakeDays;
      totalYield += reward;
      return {
        ...stake,
        reward,
        stakeDays
      };
    });

    // Calculate total expenses
    const totalExpenses = body.expenses?.reduce((sum, expense) => sum + expense.amountMUSD, 0) || 0;
    
    // Calculate final amounts for distribution
    const totalToDistribute = totalStaked + totalYield - totalExpenses;
    
    if (totalToDistribute < 0) {
      return NextResponse.json(
        { success: false, error: 'Expenses exceed total staked amount and yield' },
        { status: 400 }
      );
    }

    // Calculate distribution based on method
    const distributions = stakeRewards.map(stake => {
      let distributionAmount: number;
      
      if (body.distributionMethod === 'equal') {
        distributionAmount = totalToDistribute / stakeRewards.length;
      } else {
        // Proportional to stake amount
        const proportion = stake.stakeAmount / totalStaked;
        distributionAmount = totalToDistribute * proportion;
      }
      
      return {
        userId: stake.userId,
        userAddress: stake.userAddress,
        userName: stake.userName,
        originalStake: stake.stakeAmount,
        yield: stake.reward,
        finalAmount: distributionAmount,
        netGain: distributionAmount - stake.stakeAmount
      };
    });

    // TODO: Execute actual transfers on Mezo
    /*
    const transferPromises = distributions.map(dist => 
      mezoClient.transferMUSD({
        fromAddress: 'TRIP_VAULT_ADDRESS', // Would be the trip's vault address
        toAddress: dist.userAddress,
        amountMUSD: dist.finalAmount,
        memo: `Trip settlement: ${dist.originalStake} stake + ${dist.yield} yield`
      })
    );
    
    const transferResults = await Promise.all(transferPromises);
    const allSuccessful = transferResults.every(result => result.success);
    
    if (!allSuccessful) {
      return NextResponse.json(
        { success: false, error: 'Some transfers failed during settlement' },
        { status: 500 }
      );
    }
    */

    // Mark all stakes as inactive (settled)
    await db.update(stakes)
      .set({ active: false })
      .where(eq(stakes.groupId, body.tripId));

    console.log(`[TRIPS] Settled trip ${body.tripId}. Distributed ${totalToDistribute} MUSD to ${distributions.length} members`);

    return NextResponse.json({
      success: true,
      settlement: {
        tripId: body.tripId,
        totalStaked,
        totalYield,
        totalExpenses,
        totalDistributed: totalToDistribute,
        distributions,
        settlementDate: new Date().toISOString()
      },
      message: 'Trip settled successfully'
    });

  } catch (error) {
    console.error('[TRIPS] Trip settlement error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}