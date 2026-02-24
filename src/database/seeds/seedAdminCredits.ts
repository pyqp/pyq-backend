// Add this to your backend/src/server.ts or create backend/src/scripts/seedAdminCredits.ts

import User from '../../models/User.model';
import { addDays } from '../../utils/helpers';

export async function ensureAdminCredits() {
  try {
    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    
    for (const admin of admins) {
      // Check if admin has valid credits
      const validCredits = admin.credits.batches
        .filter((batch: any) => {
          return (
            batch.status === 'active' &&
            batch.creditsRemaining > 0 &&
            new Date(batch.expiryDate) > new Date()
          );
        })
        .reduce((sum: number, batch: any) => sum + batch.creditsRemaining, 0);
      
      // If admin has less than 100 valid credits, add more
      if (validCredits < 100) {
        console.log(`🔧 Granting credits to admin: ${admin.email}`);
        
        // Add 1000 credits valid for 10 years
        await admin.addCredits(1000, 3650, 'Admin Unlimited Access');
        
        console.log(`✅ Admin ${admin.email} now has ${admin.credits.total} total credits`);
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring admin credits:', error);
  }
}