import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
            name: 'Alice Johnson',
            email: 'alice.johnson@example.com',
            createdAt: new Date('2024-11-15T10:30:00Z').toISOString(),
        },
        {
            address: '0x5A8b3C9D2e1f4A6B8c0D2E4f6A8b0C2d4e6F8a0B',
            name: 'Bob Martinez',
            email: 'bob.martinez@example.com',
            createdAt: new Date('2024-12-01T14:22:00Z').toISOString(),
        },
        {
            address: '0x1234567890aBcDeF1234567890aBcDeF12345678',
            name: 'Carol Zhang',
            email: 'carol.zhang@example.com',
            createdAt: new Date('2024-12-18T09:15:00Z').toISOString(),
        },
        {
            address: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
            name: 'David Kumar',
            email: 'david.kumar@example.com',
            createdAt: new Date('2025-01-05T16:45:00Z').toISOString(),
        },
        {
            address: '0x9876543210FeDcBa9876543210FeDcBa98765432',
            name: 'Emma Wilson',
            email: 'emma.wilson@example.com',
            createdAt: new Date('2025-01-22T11:00:00Z').toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});