// src/utils/testDatabaseIntegration.ts
// Keep this for comprehensive testing

import { supabase } from '@/services/supabase/client';
import { productService, stackService, scanService } from '@/services/database';
import type { UserStack } from '@/types';

export const testDatabaseIntegration = async () => {
  console.log('🧪 Starting Database Integration Tests...\n');

  let testUserId: string | null = null;

  try {
    // Test 1: Anonymous Authentication
    console.log('1️⃣ Testing Anonymous Auth...');
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    console.log('✅ Anonymous auth successful:', authData.user?.id);

    // Test 2: User Creation
    console.log('\n2️⃣ Testing User Creation...');
    const { data: userId, error: userError } = await supabase.rpc(
      'create_user_with_profile',
      {
        p_auth_id: authData.user?.id,
        p_is_anonymous: true,
      }
    );
    if (userError) throw userError;
    testUserId = userId;
    console.log('✅ User created:', userId);

    // Test 3: Product Query
    console.log('\n3️⃣ Testing Product Query...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    if (productError) throw productError;
    console.log(
      '✅ Product query successful:',
      products?.length || 0,
      'products'
    );

    // Test 4: Stack Operations (only if user was created)
    if (testUserId) {
      console.log('\n4️⃣ Testing Stack Operations...');
      const testStackItem: Partial<UserStack> = {
        name: 'Test Vitamin D',
        type: 'supplement' as const,
        dosage: '1000 IU',
        frequency: 'Daily',
        ingredients: [{ name: 'Vitamin D3', amount: 1000, unit: 'IU' }],
      };

      const stackItem = await stackService.addToStack(
        testUserId,
        testStackItem
      );
      console.log('✅ Stack item added:', stackItem?.id);

      // Test 5: Points System
      console.log('\n5️⃣ Testing Points System...');
      const { data: pointsResult, error: pointsError } = await supabase.rpc(
        'increment_points',
        {
          p_user_id: testUserId,
          p_points: 10,
          p_reason: 'test_scan',
        }
      );
      if (pointsError) throw pointsError;
      console.log('✅ Points awarded:', pointsResult);

      // Test 6: Scan History
      console.log('\n6️⃣ Testing Scan History...');
      const scanResult = await scanService.recordScan(
        testUserId,
        null, // No product ID for this test
        'barcode',
        85
      );
      console.log('✅ Scan recorded:', scanResult?.id);
    }

    // Test 7: Storage Buckets
    console.log('\n7️⃣ Testing Storage Access...');
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();
    if (bucketError) {
      console.warn(
        '⚠️  Storage access limited (this is normal for client-side)'
      );
    } else {
      console.log(
        '✅ Storage buckets accessible:',
        buckets?.map(b => b.name) || []
      );
    }

    console.log(
      '\n✅ All tests passed! Database integration is working correctly.'
    );

    // Cleanup
    await supabase.auth.signOut();

    return { success: true };
  } catch (error) {
    console.error('\n❌ Test failed:', error);

    // Cleanup on error
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore cleanup errors
    }

    return { success: false, error };
  }
};
