// src/utils/testDatabase.ts
// Keep this for quick connection tests

import { supabase } from "@/services/supabase/client";

export const testDatabaseConnection = async () => {
  console.log("🧪 Testing Database Connection...\n");

  try {
    // Test 1: Anonymous auth
    console.log("Testing anonymous auth...");
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    console.log("✅ Anonymous auth works");

    // Test 2: Product query
    console.log("\nTesting product query...");
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (productError) throw productError;
    console.log("✅ Product query works");

    // Test 3: User creation
    console.log("\nTesting user creation...");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase.rpc(
        "create_user_with_profile",
        {
          p_auth_id: user.id,
          p_is_anonymous: true,
        }
      );

      if (profileError) throw profileError;
      console.log("✅ User creation works");
    }

    console.log("\n✅ All tests passed!");

    // Clean up
    await supabase.auth.signOut();

    return { success: true };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return { success: false, error };
  }
};
