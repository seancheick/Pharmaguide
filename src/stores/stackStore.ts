import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserStack } from "../types";

interface StackStore {
  stack: UserStack[];
  loading: boolean;
  initialized: boolean;

  // Actions
  loadStack: () => Promise<void>;
  addToStack: (item: Omit<UserStack, "id">) => Promise<void>;
  removeFromStack: (id: string) => Promise<void>;
  updateStackItem: (id: string, updates: Partial<UserStack>) => Promise<void>;
  clearStack: () => Promise<void>;
}

export const useStackStore = create<StackStore>((set, get) => ({
  stack: [],
  loading: false,
  initialized: false,

  loadStack: async () => {
    set({ loading: true });
    try {
      const stored = await AsyncStorage.getItem("user_stack");
      if (stored) {
        set({ stack: JSON.parse(stored), initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch (error) {
      console.error("Error loading stack:", error);
    } finally {
      set({ loading: false });
    }
  },

  addToStack: async (item) => {
    const newItem: UserStack = {
      ...item,
      id: Date.now().toString(), // Simple ID generation
    };

    const newStack = [...get().stack, newItem];
    set({ stack: newStack });

    try {
      await AsyncStorage.setItem("user_stack", JSON.stringify(newStack));
    } catch (error) {
      console.error("Error saving stack:", error);
    }
  },

  removeFromStack: async (id) => {
    const newStack = get().stack.filter((item) => item.id !== id);
    set({ stack: newStack });

    try {
      await AsyncStorage.setItem("user_stack", JSON.stringify(newStack));
    } catch (error) {
      console.error("Error saving stack:", error);
    }
  },

  updateStackItem: async (id, updates) => {
    const newStack = get().stack.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    set({ stack: newStack });

    try {
      await AsyncStorage.setItem("user_stack", JSON.stringify(newStack));
    } catch (error) {
      console.error("Error saving stack:", error);
    }
  },

  clearStack: async () => {
    set({ stack: [] });
    try {
      await AsyncStorage.removeItem("user_stack");
    } catch (error) {
      console.error("Error clearing stack:", error);
    }
  },
}));
