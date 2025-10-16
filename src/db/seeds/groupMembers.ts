import { db } from '@/db';
import { groupMembers } from '@/db/schema';

async function main() {
    const sampleGroupMembers = [
        // Group 1 (Tokyo Trip 2024) - 4 members
        {
            groupId: 1,
            userId: 1,
            role: 'ADMIN',
            joinedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        },
        {
            groupId: 1,
            userId: 2,
            role: 'MEMBER',
            joinedAt: new Date('2024-01-15T14:20:00Z').toISOString(),
        },
        {
            groupId: 1,
            userId: 3,
            role: 'MEMBER',
            joinedAt: new Date('2024-01-16T09:15:00Z').toISOString(),
        },
        {
            groupId: 1,
            userId: 4,
            role: 'MEMBER',
            joinedAt: new Date('2024-01-16T16:45:00Z').toISOString(),
        },
        // Group 2 (Roommates) - 3 members
        {
            groupId: 2,
            userId: 2,
            role: 'ADMIN',
            joinedAt: new Date('2024-02-01T11:00:00Z').toISOString(),
        },
        {
            groupId: 2,
            userId: 3,
            role: 'MEMBER',
            joinedAt: new Date('2024-02-01T11:30:00Z').toISOString(),
        },
        {
            groupId: 2,
            userId: 5,
            role: 'MEMBER',
            joinedAt: new Date('2024-02-01T15:20:00Z').toISOString(),
        },
        // Group 3 (Ski Weekend) - 4 members
        {
            groupId: 3,
            userId: 3,
            role: 'ADMIN',
            joinedAt: new Date('2024-03-01T08:45:00Z').toISOString(),
        },
        {
            groupId: 3,
            userId: 1,
            role: 'MEMBER',
            joinedAt: new Date('2024-03-01T10:15:00Z').toISOString(),
        },
        {
            groupId: 3,
            userId: 4,
            role: 'MEMBER',
            joinedAt: new Date('2024-03-01T13:30:00Z').toISOString(),
        },
        {
            groupId: 3,
            userId: 5,
            role: 'MEMBER',
            joinedAt: new Date('2024-03-02T09:00:00Z').toISOString(),
        },
    ];

    await db.insert(groupMembers).values(sampleGroupMembers);
    
    console.log('✅ Group members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});