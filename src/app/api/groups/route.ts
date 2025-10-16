import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { groups } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = db.select().from(groups);

    if (search) {
      query = query.where(
        or(
          like(groups.name, `%${search}%`),
          like(groups.description, `%${search}%`)
        )
      );
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
    const { name, description, createdById } = body;

    // Validation: name is required
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        {
          error: 'Name is required and must be a non-empty string',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Validation: createdById is required and must be valid integer
    if (!createdById || typeof createdById !== 'number' || !Number.isInteger(createdById)) {
      return NextResponse.json(
        {
          error: 'CreatedById is required and must be a valid integer',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      createdById,
      createdAt: new Date().toISOString()
    };

    const newGroup = await db.insert(groups)
      .values(insertData)
      .returning();

    return NextResponse.json(newGroup[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}