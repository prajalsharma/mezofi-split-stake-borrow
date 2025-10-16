import { db } from '@/db';
import { stakes } from '@/db/schema';

async function main() {
    const sampleStakes = [
        {
            groupId: 1,
            userId: 1,
            amount: 250.00,
            startDate: new Date('2024-12-15').toISOString(),
            endDate: new Date('2025-06-15').toISOString(),
            rewardRate: 0.08,
            claimedRewards: 0,
            active: true,
            createdAt: new Date('2024-12-15').toISOString(),
        },
        {
            groupId: 1,
            userId: 4,
            amount: 750.00,
            startDate: new Date('2024-11-01').toISOString(),
            endDate: new Date('2025-11-01').toISOString(),
            rewardRate: 0.12,
            claimedRewards: 30.00,
            active: true,
            createdAt: new Date('2024-11-01').toISOString(),
        },
        {
            groupId: 2,
            userId: 2,
            amount: 500.00,
            startDate: new Date('2024-12-01').toISOString(),
            endDate: new Date('2025-09-01').toISOString(),
            rewardRate: 0.10,
            claimedRewards: 0,
            active: true,
            createdAt: new Date('2024-12-01').toISOString(),
        },
        {
            groupId: 3,
            userId: 5,
            amount: 1000.00,
            startDate: new Date('2024-10-15').toISOString(),
            endDate: new Date('2025-10-15').toISOString(),
            rewardRate: 0.15,
            claimedRewards: 125.00,
            active: false,
            createdAt: new Date('2024-10-15').toISOString(),
        }
    ];

    await db.insert(stakes).values(sampleStakes);
    
    console.log('✅ Stakes seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});