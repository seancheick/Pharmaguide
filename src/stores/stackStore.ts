import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase/client";
import type { UserStack } from "../types";
import type { PostgrestError } from "@supabase/supabase-js"; // Import PostgrestError

// Add this to your stackStore.ts after the imports

// Helper function to safely get user ID with the new RPC function
const createUserIfNeeded = async (
  authId: string,
  email?: string | null
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc("create_user_with_profile", {
      p_auth_id: authId,
      p_email: email || null,
      p_is_anonymous: !email,
    });

    if (error) {
      console.error("Error creating user with profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createUserIfNeeded:", error);
    return null;
  }
};

// Add a timeout wrapper for Supabase calls
const withTimeout = async (promise, timeoutMs = 5000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Operation timed out"));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Define a structured error type for consistency
interface StackStoreError {
  message: string;
  code?: string;
  originalError?: any;
}

interface StackStore {
  stack: UserStack[];
  initialized: boolean;
  loading: boolean;
  _getUserId: () => Promise<string | null>;
  loadStack: () => Promise<void>;
  addToStack: (item: Partial<UserStack>) => Promise<void>;
  removeFromStack: (itemId: string) => Promise<void>;
  updateStack: (itemId: string, updates: Partial<UserStack>) => Promise<void>;
  syncWithServer: () => Promise<void>;
  // Add a listener for auth changes to re-sync/reload
  _handleAuthChange: (event: string, session: any) => Promise<void>;
}

const STACK_STORAGE_KEY = "pharmaguide_user_stack";

export const useStackStore = create<StackStore>((set, get) => ({
  stack: [],
  initialized: false,
  loading: false,

  // Helper to get user ID from Supabase Auth and database
  // Update the _getUserId method in your store to use the new function:
  _getUserId: async (): Promise<string | null> => {
    try {
      // First try to get from AsyncStorage for faster response
      const storedUserId = await AsyncStorage.getItem("current_user_id");
      if (storedUserId) {
        return storedUserId;
      }

      // If not in storage, try to get from auth session with timeout
      const {
        data: { session },
      } = await withTimeout(
        supabase.auth.getSession(),
        3000 // 3 second timeout
      );

      if (!session?.user) {
        return null;
      }

      // Try to get user ID from database
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("users")
            .select("id")
            .eq("auth_id", session.user.id)
            .single(),
          3000 // 3 second timeout
        );

        if (error || !data) {
          console.warn("User not found in database, attempting to create");
          return await createUserIfNeeded(session.user.id, session.user.email);
        }

        return data.id;
      } catch (dbError) {
        console.error("Database error getting user ID:", dbError);
        // Fall back to local storage or memory cache
        return null;
      }
    } catch (error) {
      console.error("Error getting user ID for stack operations:", error);
      return null;
    }
  },

  loadStack: async () => {
    set({ loading: true });
    try {
      // First try to load from local storage for immediate display
      const storedStack = await AsyncStorage.getItem(STACK_STORAGE_KEY);
      const localStack: UserStack[] = storedStack
        ? JSON.parse(storedStack)
        : [];

      // Set local stack immediately to improve perceived performance
      if (localStack.length > 0) {
        set({ stack: localStack });
      }

      // Then try to get user ID with timeout protection
      const userId = await get()._getUserId();
      let dbStack: UserStack[] = [];
      let serverError: PostgrestError | null = null;

      if (userId) {
        try {
          const { data, error } = await withTimeout(
            supabase
              .from("user_stack")
              .select("*")
              .eq("user_id", userId)
              .eq("active", true)
              .order("updated_at", { ascending: false }),
            5000 // 5 second timeout
          );

          if (error) {
            serverError = error;
            console.warn(
              "Failed to load stack from DB, using local fallback:",
              error.message
            );
          } else {
            dbStack = data as UserStack[];
          }
        } catch (timeoutError) {
          console.warn("Database request timed out, using local fallback");
          serverError = { message: "Request timed out" } as PostgrestError;
        }
      } else {
        console.warn("No valid user ID found, using local stack data only.");
      }

      // Merge database and local stacks if we got data from the server
      let mergedStack: UserStack[] = localStack;

      if (dbStack.length > 0 && !serverError) {
        // Merge database and local stacks, preferring the most recently updated version
        mergedStack = [...dbStack, ...localStack].reduce<UserStack[]>(
          (acc, item) => {
            const existing = acc.find((i: UserStack) => i.id === item.id);
            if (
              !existing ||
              new Date(item.updated_at) > new Date(existing.updated_at)
            ) {
              return [...acc.filter((i: UserStack) => i.id !== item.id), item];
            }
            return acc;
          },
          [] as UserStack[]
        );
      }

      set({ stack: mergedStack, initialized: true });

      // Save the merged stack back to local storage
      await AsyncStorage.setItem(
        STACK_STORAGE_KEY,
        JSON.stringify(mergedStack)
      );

      // Attempt to sync local-only data to server after load if connection was restored
      if (!serverError && userId) {
        // Only sync if DB load was successful and user exists
        await get().syncWithServer();
      }
    } catch (error: any) {
      console.error("Error loading stack (outer catch):", error);
      set({ initialized: true }); // Ensure initialized is true even on error

      // Always attempt to load from local storage as a last resort
      try {
        const stored = await AsyncStorage.getItem(STACK_STORAGE_KEY);
        if (stored) {
          const localStack: UserStack[] = JSON.parse(stored);
          set({ stack: localStack });
        }
      } catch (localError) {
        console.error("Error loading local stack fallback:", localError);
      }
    } finally {
      set({ loading: false });
    }
  },

  addToStack: async (item) => {
    set({ loading: true }); // Set loading for individual action
    const timestamp = new Date().toISOString();
    const tempId = `temp_${Date.now()}`; // Temporary ID for optimistic update
    const newItem: UserStack = {
      id: tempId, // Use temporary ID
      user_id: "pending_sync", // Mark as needing sync
      item_id: item.item_id || tempId, // Use item_id or tempId
      name: item.name || "Unknown Product",
      type: item.type || "supplement",
      dosage: item.dosage || "As directed",
      frequency: item.frequency || "Daily",
      brand: item.brand,
      imageUrl: item.imageUrl,
      ingredients: item.ingredients,
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Optimistic update
    set((state) => ({ stack: [...state.stack, newItem] }));

    try {
      const userId = await get()._getUserId();
      if (!userId) {
        // If no user, keep as local-only and log
        throw {
          message: "Not authenticated. Item added locally only.",
          code: "auth/not-authenticated",
        } as StackStoreError;
      }

      // Prepare item data for database insert
      const itemDataForDb = {
        user_id: userId,
        name: newItem.name,
        type: newItem.type,
        dosage: newItem.dosage,
        frequency: newItem.frequency,
        item_id: newItem.item_id, // Use actual product ID from scan
        brand: newItem.brand,
        imageUrl: newItem.imageUrl,
        ingredients: newItem.ingredients,
        active: true,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const { data, error } = await supabase
        .from("user_stack")
        .insert(itemDataForDb)
        .select()
        .single();

      if (error) {
        throw {
          message: error.message || "Failed to add item to database.",
          code: (error as PostgrestError).code || "db/insert-failed",
          originalError: error,
        } as StackStoreError;
      }

      // Replace temporary item with actual server item
      set((state) => ({
        stack: state.stack.map((sItem) =>
          sItem.id === tempId ? (data as UserStack) : sItem
        ),
      }));

      // Update local storage
      await AsyncStorage.setItem(
        STACK_STORAGE_KEY,
        JSON.stringify(get().stack)
      );
    } catch (error: any) {
      console.error("Error adding to stack (DB sync failed):", error);
      // Revert optimistic update or mark as local-only if DB failed
      set((state) => ({
        stack: state.stack.map(
          (sItem) =>
            sItem.id === tempId
              ? { ...sItem, user_id: "local", id: `local_${Date.now()}` }
              : sItem // Assign new local ID
        ),
      }));
      await AsyncStorage.setItem(
        STACK_STORAGE_KEY,
        JSON.stringify(get().stack)
      );
      throw {
        message: error.message || "Failed to add item. Added locally only.",
        code: error.code || "stack/add-failed",
        originalError: error,
      } as StackStoreError;
    } finally {
      set({ loading: false });
    }
  },

  removeFromStack: async (itemId) => {
    const timestamp = new Date().toISOString();

    // Optimistic update
    const prevStack = get().stack;
    set((state) => ({
      stack: state.stack.filter((item) => item.id !== itemId),
    }));
    await AsyncStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(get().stack));

    try {
      const { error } = await supabase
        .from("user_stack")
        .update({ active: false, updated_at: timestamp })
        .eq("id", itemId);

      if (error) {
        throw {
          message: error.message || "Failed to remove item from database.",
          code: (error as PostgrestError).code || "db/update-failed",
          originalError: error,
        } as StackStoreError;
      }
    } catch (error: any) {
      console.error("Error removing from stack (DB sync failed):", error);
      // Revert optimistic update on failure
      set({ stack: prevStack });
      await AsyncStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(prevStack));
      throw {
        message: error.message || "Failed to remove item. Please try again.",
        code: error.code || "stack/remove-failed",
        originalError: error,
      } as StackStoreError;
    }
  },

  updateStack: async (itemId: string, updates: Partial<UserStack>) => {
    const timestamp = new Date().toISOString();
    const updateData = {
      ...updates,
      updated_at: timestamp,
    };

    // Optimistic update
    const prevStack = get().stack;
    set((state) => ({
      stack: state.stack.map((item) =>
        item.id === itemId ? { ...item, ...updateData } : item
      ),
    }));
    await AsyncStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(get().stack));

    try {
      const { error } = await supabase
        .from("user_stack")
        .update(updateData)
        .eq("id", itemId);

      if (error) {
        throw {
          message: error.message || "Failed to update item in database.",
          code: (error as PostgrestError).code || "db/update-failed",
          originalError: error,
        } as StackStoreError;
      }
    } catch (error: any) {
      console.error("Error updating stack item (DB sync failed):", error);
      // Revert optimistic update on failure
      set({ stack: prevStack });
      await AsyncStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(prevStack));
      throw {
        message: error.message || "Failed to update item. Please try again.",
        code: error.code || "stack/update-failed",
        originalError: error,
      } as StackStoreError;
    }
  },

  syncWithServer: async () => {
    try {
      const userId = await get()._getUserId();
      if (!userId) {
        console.warn("Cannot sync with server: No user ID available.");
        return;
      }

      const localStack = get().stack;

      // Identify items that are local-only (need insert)
      const localOnlyItems = localStack.filter(
        (item) => item.user_id === "local" || item.user_id === "pending_sync"
      );

      // Push local-only items to server
      for (const item of localOnlyItems) {
        // Exclude the 'id' field as it's generated by DB
        const { id, user_id, ...itemData } = item;
        const { data: insertedData, error } = await supabase
          .from("user_stack")
          .insert({
            ...itemData,
            user_id: userId, // Ensure correct user_id is set for server
            created_at: item.created_at, // Preserve original creation time if available
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error(
            `Error syncing local item ${item.name} to server:`,
            error
          );
          // Decide whether to remove item from local stack or retry later
          // For now, let it be reloaded on next loadStack
          continue;
        } else if (insertedData) {
          // Replace the local item with the server-generated one (new ID, confirmed user_id)
          set((state) => ({
            stack: state.stack.map((sItem) =>
              sItem.id === item.id ? (insertedData as UserStack) : sItem
            ),
          }));
        }
      }

      // After pushing local-only items, a full reload is the simplest way to ensure consistency
      // It handles updates and deletions implicitly by re-merging
      await get().loadStack();
    } catch (error: any) {
      console.error("Error syncing with server:", error);
      // Do not throw here, as sync is a background operation and shouldn't crash UI
    }
  },

  // Listen for Supabase Auth changes to trigger stack reload/sync
  _handleAuthChange: async (event, session) => {
    // Only reload/sync on relevant auth events (e.g., SIGNED_IN, SIGNED_OUT, INITIAL_SESSION)
    // SIGNED_OUT will effectively trigger a load for anonymous user, or clear if no anon support
    // SIGNED_IN will allow loading of their personal stack
    if (
      event === "SIGNED_IN" ||
      event === "SIGNED_OUT" ||
      event === "INITIAL_SESSION"
    ) {
      console.log(`Auth event: ${event}. Reloading stack...`);
      await get().loadStack();
    }
  },
}));

// Subscribe to auth changes outside the store definition to avoid re-subscription issues
supabase.auth.onAuthStateChange((event, session) => {
  useStackStore.getState()._handleAuthChange(event, session);
});
