import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stakes, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { searchParams } = new URL(request.url);

    // Validate groupId
    if (!groupId || isNaN(parseInt(groupId))) {
      return NextResponse.json(
        { error: 'Valid group ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedGroupId = parseInt(groupId);

    // Extract query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const activeParam = searchParams.get('active');

    // Build base query with join
    let query = db
      .select({
        stake: stakes,
        user: users,
      })
      .from(stakes)
      .leftJoin(users, eq(stakes.userId, users.id))
      .$dynamic();

    // Apply filters
    if (activeParam !== null) {
      const active = activeParam === 'true';
      query = query.where(
        and(eq(stakes.groupId, parsedGroupId), eq(stakes.active, active))
      );
    } else {
      query = query.where(eq(stakes.groupId, parsedGroupId));
    }

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    // Transform results to include nested user data
    const transformedResults = results.map((row) => ({
      id: row.stake.id,
      groupId: row.stake.groupId,
      userId: row.stake.userId,
      amount: row.stake.amount,
      startDate: row.stake.startDate,
      endDate: row.stake.endDate,
      rewardRate: row.stake.rewardRate,
      claimedRewards: row.stake.claimedRewards,
      active: row.stake.active,
      createdAt: row.stake.createdAt,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.name,
            address: row.user.address,
            email: row.user.email,
          }
        : null,
    }));

    return NextResponse.json(transformedResults, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}