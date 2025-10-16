import { db } from '@/db';
import { groups } from '@/db/schema';

async function main() {
    const sampleGroups = [
        {
            name: 'Tokyo Trip 2024',
            description: 'Planning our amazing trip to Tokyo in spring',
            createdById: 1,
            createdAt: new Date('2024-11-15').toISOString(),
        },
        {
            name: 'Roommates',
            description: 'Apartment 4B shared expenses',
            createdById: 2,
            createdAt: new Date('2024-10-20').toISOString(),
        },
        {
            name: 'Ski Weekend',
            description: 'Winter ski trip to Whistler',
            createdById: 3,
            createdAt: new Date('2024-12-01').toISOString(),
        }
    ];

    await db.insert(groups).values(sampleGroups);
    
    console.log('✅ Groups seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});