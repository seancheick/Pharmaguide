// src/stores/stackStore.ts - Enhanced version using safeStorage

import { create } from 'zustand';
import { safeStorage } from '../utils/safeStorage'; // Use safeStorage instead
// import { supabase } from '../services/supabase/client';
import { generateUUID } from '../utils/uuid';
import {
  transformDbToUserStack,
  transformDbArrayToUserStack,
  createStackInsertPayload,
  createStackUpdatePayload,
  validateStackItem,
  sanitizeStackItem,
} from '../utils/databaseTransforms';
import type { UserStack, DatabaseUserStack } from '../types';
import type { PostgrestError } from '@supabase/supabase-js';

// Helper function to safely get user ID with the new RPC function
// All user stack data is now local-only. No user creation or Supabase sync needed.
const createUserIfNeeded = async (
  authId: string,
  email?: string | null
): Promise<string | null> => {
  return null;
};

// Helper function to test database connectivity
// No remote DB connection needed for local-only stack
const testDatabaseConnection = async (userId: string): Promise<boolean> => {
  return true;
};

// Add a timeout wrapper for Supabase calls
const withTimeout = async (promise: Promise<any>, timeoutMs = 5000) => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Operation timed out'));
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
  _handleAuthChange: (event: string, session: any) => Promise<void>;
}

const STACK_STORAGE_KEY = 'pharmaguide_user_stack';

export const useStackStore = create<StackStore>((set, get) => ({
  stack: [],
  initialized: false,
  loading: false,

  // No user ID needed for local-only stack
  _getUserId: async (): Promise<string | null> => {
    return null;
  },

  loadStack: async () => {
    set({ loading: true });
    try {
      // First try to load from local storage for immediate display
      const storedStack = await safeStorage.getItem(STACK_STORAGE_KEY);
      const localStack: UserStack[] = storedStack
        ? JSON.parse(storedStack)
        : [];

      // Set local stack immediately to improve perceived performance
      if (localStack.length > 0) {
        set({ stack: localStack });
      }

      // Only load from local storage; no remote stack
      set({ stack: localStack, initialized: true });
      await safeStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(localStack));
    } catch (error: any) {
      console.error('Error loading stack (outer catch):', error);
      set({ initialized: true });

      // Always attempt to load from local storage as a last resort
      try {
        const stored = await safeStorage.getItem(STACK_STORAGE_KEY);
        if (stored) {
          const localStack: UserStack[] = JSON.parse(stored);
          set({ stack: localStack });
        }
      } catch (localError) {
        console.error('Error loading local stack fallback:', localError);
      }
    } finally {
      set({ loading: false });
    }
  },

  addToStack: async item => {
    set({ loading: true });
    const timestamp = new Date().toISOString();

    // Generate proper UUIDs for both id and item_id
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    };

    const tempId = generateUUID();
    const itemId = generateUUID(); // Always generate a new UUID for item_id

    // Sanitize and validate input
    const sanitizedItem = sanitizeStackItem({
      ...item,
      name: item.name || 'Unknown Product',
      type: item.type || 'supplement',
      dosage: item.dosage || 'As directed',
      frequency: item.frequency || 'Daily',
    });

    // Validate required fields
    const validationErrors = validateStackItem(sanitizedItem);
    if (validationErrors.length > 0) {
      throw {
        message: `Validation failed: ${validationErrors.join(', ')}`,
        code: 'validation/invalid-item',
      } as StackStoreError;
    }

    const newItem: UserStack = {
      id: tempId,
      user_id: 'pending_sync',
      item_id: itemId, // Use proper UUID instead of potentially invalid item.item_id
      name: sanitizedItem.name!,
      type: sanitizedItem.type!,
      dosage: sanitizedItem.dosage,
      frequency: sanitizedItem.frequency,
      brand: sanitizedItem.brand,
      imageUrl: sanitizedItem.imageUrl,
      ingredients: sanitizedItem.ingredients || [],
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Optimistic update
    set(state => ({ stack: [...state.stack, newItem] }));

    try {
      // Only add to local stack
      await safeStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(get().stack));
    } catch (error: any) {
      console.error('Error adding to stack (local only):', error);
      set(state => ({
        stack: state.stack.map(sItem =>
          sItem.id === tempId
            ? { ...sItem, user_id: 'local', id: `local_${Date.now()}` }
            : sItem
        ),
      }));
      await safeStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(get().stack));
      throw {
        message: error.message || 'Failed to add item locally.',
        code: error.code || 'stack/add-failed',
        originalError: error,
      } as StackStoreError;
    } finally {
      set({ loading: false });
    }
  },

  removeFromStack: async itemId => {
    const timestamp = new Date().toISOString();

    // Optimistic update
    const prevStack = get().stack;
    set(state => ({
      stack: state.stack.filter(item => item.id !== itemId),
    }));
    await safeStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(get().stack));

    // Only update local stack
    // No remote removal
  },

  updateStack: async (itemId: string, updates: Partial<UserStack>) => {
    const timestamp = new Date().toISOString();

    // Sanitize and validate updates
    const sanitizedUpdates = sanitizeStackItem(updates);
    const validationErrors = validateStackItem(sanitizedUpdates);
    if (validationErrors.length > 0) {
      throw {
        message: `Validation failed: ${validationErrors.join(', ')}`,
        code: 'validation/invalid-update',
      } as StackStoreError;
    }

    const updateData = {
      ...sanitizedUpdates,
      updated_at: timestamp,
    };

    // Optimistic update
    const prevStack = get().stack;
    set(state => ({
      stack: state.stack.map(item =>
        item.id === itemId ? { ...item, ...updateData } : item
      ),
    }));
    await safeStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(get().stack));

    // Only update local stack
    // No remote update
  },

  // No-op: All stack data is local-only, no server sync
  syncWithServer: async () => {},

  _handleAuthChange: async (event, session) => {
    if (
      event === 'SIGNED_IN' ||
      event === 'SIGNED_OUT' ||
      event === 'INITIAL_SESSION'
    ) {
      console.log(`Auth event: ${event}. Reloading stack...`);
      await get().loadStack();
    }
  },
}));

// No auth sync needed for local-only stack
// (If you want to clear stack on sign out, handle here)
