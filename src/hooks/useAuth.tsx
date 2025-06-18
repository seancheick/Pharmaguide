// src/hooks/useAuth.tsx
import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../services/supabase/client";
import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User as AppUser } from "../types";

// Create a memory-based storage fallback for environments where AsyncStorage might fail or during development
const memoryStorage = new Map<string, string>();

// Create a safe storage wrapper with multiRemove to gracefully handle AsyncStorage errors
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_"); // Sanitize key for AsyncStorage
      return await AsyncStorage.getItem(safeKey);
    } catch (error) {
      console.warn(`Safe storage getItem failed for key ${key}:`, error);
      return memoryStorage.get(key) || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_"); // Sanitize key for AsyncStorage
      await AsyncStorage.setItem(safeKey, value);
    } catch (error) {
      console.warn(`Safe storage setItem failed for key ${key}:`, error);
      memoryStorage.set(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_"); // Sanitize key for AsyncStorage
      await AsyncStorage.removeItem(safeKey);
    } catch (error) {
      console.warn(`Safe storage removeItem failed for key ${key}:`, error);
      memoryStorage.delete(key);
    }
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      const safeKeys = keys.map((key) => key.replace(/[^a-zA-Z0-9_]/g, "_")); // Sanitize keys
      await AsyncStorage.multiRemove(safeKeys);
    } catch (error) {
      console.warn("Safe storage multiRemove failed:", error);
      keys.forEach((key) => memoryStorage.delete(key));
    }
  },
};

// Define a consistent error structure for authentication operations
interface AuthError {
  message: string;
  code: string;
  originalError?: any;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  convertAnonymousToEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize user to null. The useEffect will handle fetching/creating the actual user.
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Transforms a Supabase database user record (with joined profile/preferences)
   * into the AppUser type used throughout the frontend.
   */
  const transformDatabaseUserToAppUser = (dbUser: any): AppUser => {
    return {
      id: dbUser.id,
      email: dbUser.email,
      is_anonymous: dbUser.is_anonymous,
      profile: {
        firstName: dbUser.profile?.first_name,
        lastName: dbUser.profile?.last_name,
        age: dbUser.profile?.age,
        gender: dbUser.profile?.gender,
        healthGoals: dbUser.profile?.health_goals || [],
        conditions: dbUser.profile?.conditions || [],
        medications: dbUser.profile?.medications || [],
        allergies: dbUser.profile?.allergies || [],
        genetics: dbUser.profile?.genetics,
      },
      preferences: {
        aiResponseStyle: dbUser.preferences?.ai_response_style || "concise",
        budgetRange: dbUser.preferences?.budget_range || "mid",
        primaryFocus: dbUser.preferences?.primary_focus || "safety",
        notifications: dbUser.preferences?.notifications || {
          push_enabled: true,
          email_enabled: true,
          reminder_frequency: "daily",
        },
      },
      // Ensure 'points' and 'streaks' are handled consistently,
      // matching the AppUser type and the data fetched from DB.
      points: dbUser.points
        ? {
            total: dbUser.points.total_points || 0,
            level: dbUser.points.level || 1,
            levelTitle: dbUser.points.level_title || "Health Novice", // Assuming you'll add this to DB or derive it
            nextLevelAt: dbUser.points.next_level_at || 100, // Assuming you'll add this to DB or derive it
          }
        : undefined, // Or a default empty object if points are always expected
      streaks: dbUser.streaks
        ? {
            current: dbUser.streaks.current_streak || 0,
            longest: dbUser.streaks.longest_streak || 0,
            lastActivity: dbUser.streaks.last_activity_date, // Corrected to match DB schema's 'last_activity_date'
          }
        : undefined, // Or a default empty object if streaks are always expected
      createdAt: dbUser.created_at, // These are typically ISO strings from DB
      updatedAt: dbUser.updated_at, // These are typically ISO strings from DB
    };
  };

  /**
   * Calls the Supabase RPC function 'create_user_with_profile' to
   * atomically create the user, user_profiles, user_preferences, user_points, and user_streaks records.
   * This is designed to be idempotent on the backend.
   *
   * @param authId The Supabase Auth user ID (uuid).
   * @param email The user's email, or null for anonymous.
   * @param isAnonymous Boolean indicating if the user is anonymous.
   * @returns The user's 'id' from the 'users' table, or null if creation failed.
   */
  const callCreateUserWithProfileRpc = async (
    authId: string,
    email: string | null,
    isAnonymous: boolean
  ): Promise<string | null> => {
    try {
      // The RPC function should handle checking for existing user in 'public.users'
      // and creating if not found, then returning the v_user_id.
      const { data, error } = await supabase.rpc("create_user_with_profile", {
        p_auth_id: authId,
        p_email: email,
        p_is_anonymous: isAnonymous,
      });

      if (error) {
        console.error("RPC 'create_user_with_profile' failed:", error);
        // Log if it's a duplicate error, but rely on RPC's idempotency
        if (error.code === "23505") {
          console.warn(
            "RPC reported duplicate key (user already exists in public.users). This is expected if RPC is idempotent."
          );
        }
        return null; // Return null on any RPC error to signal failure to caller
      }
      return data; // This should be the 'id' (UUID) from the 'users' table
    } catch (error) {
      console.error(
        "Unexpected error calling 'create_user_with_profile' RPC:",
        error
      );
      return null;
    }
  };

  /**
   * Fetches or creates a comprehensive user record (including profile and preferences)
   * in the database, linked to the Supabase Auth user.
   * This function ensures that for every Supabase Auth user, there is a corresponding
   * entry in our 'users' table and related tables.
   *
   * @param authUser The user object from Supabase Auth (e.g., session.user).
   * @returns An AppUser object, or null if the operation failed.
   */
  const createOrUpdateUser = async (authUser: any): Promise<AppUser | null> => {
    try {
      const authId = authUser.id;
      let dbUserRecord: any = null; // To hold the fetched user record

      // --- 1. Attempt to fetch existing user or create via RPC if not found ---
      // We perform this loop to handle potential timing/replication delays after initial RPC
      let initialFetchAttempts = 0;
      const maxInitialFetchRetries = 3; // Allow a few retries for the initial select
      let userFoundOrCreated = false;

      while (
        initialFetchAttempts < maxInitialFetchRetries &&
        !userFoundOrCreated
      ) {
        if (initialFetchAttempts > 0) {
          const delay = 300 * Math.pow(2, initialFetchAttempts - 1); // 300ms, 600ms, 1200ms
          console.log(
            `Retrying initial fetch for user (auth_id: ${authId}, attempt ${
              initialFetchAttempts + 1
            }/${maxInitialFetchRetries}) after ${delay}ms...`
          );
          await new Promise((res) => setTimeout(res, delay));
        }

        const { data, error: fetchError } = await supabase
          .from("users")
          .select(
            `id, email, is_anonymous, profile:user_profiles(*), preferences:user_preferences(*), points:user_points(*), streaks:user_streaks(*), created_at, updated_at`
          )
          .eq("auth_id", authId)
          .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            // User not found in 'public.users'. Attempt to create via RPC.
            console.log(
              `Initial fetch: User (auth_id: ${authId}) not found. Attempting RPC creation.`
            );
            const userIdFromRpc = await callCreateUserWithProfileRpc(
              authId,
              authUser.email,
              !authUser.email
            );

            if (!userIdFromRpc) {
              console.error(
                "Failed to obtain user ID from RPC. Cannot proceed with user creation/fetch."
              );
              return null; // RPC failed or returned no ID
            }
            // If RPC succeeded, the user *should* now exist, so we will retry the fetch in the next loop iteration
            // or rely on the final fetch after the loop. For now, break and let outer logic handle re-fetch.
            userFoundOrCreated = false; // RPC happened, but we still need to confirm fetch
            initialFetchAttempts = maxInitialFetchRetries; // Force exit loop, so we perform the final consistent fetch below
            // Or, continue loop to attempt to fetch what RPC just created.
          } else {
            // Other unexpected fetch error
            console.error(
              `Initial fetch: Error fetching user (auth_id: ${authId}):`,
              fetchError
            );
            return null;
          }
        } else {
          // User record was found directly in `public.users` during initial fetch
          dbUserRecord = data;
          userFoundOrCreated = true; // User found, exit loop
        }
        initialFetchAttempts++;
      }

      // If after initial fetch attempts, user was still not found or created, perform a final robust fetch.
      // This is crucial, as the RPC may have just finished creation.
      if (!dbUserRecord) {
        console.log(
          `Final attempt to fetch user (auth_id: ${authId}) after initial attempts/RPC completion.`
        );
        const { data: finalUserRecord, error: finalFetchError } = await supabase
          .from("users")
          .select(
            `id, email, is_anonymous, profile:user_profiles(*), preferences:user_preferences(*), points:user_points(*), streaks:user_streaks(*), created_at, updated_at`
          )
          .eq("auth_id", authId)
          .single();

        if (finalFetchError) {
          console.error(
            `Failed to fetch user (auth_id: ${authId}) after RPC creation/all retries:`,
            finalFetchError
          );
          return null;
        }
        dbUserRecord = finalUserRecord;
      }

      // --- 2. Update anonymous status if user converts ---
      // If user already existed and was anonymous, but now has an email (i.e., converted from anonymous)
      if (dbUserRecord && authUser.email && dbUserRecord.is_anonymous) {
        console.log(`Updating anonymous status for user: ${dbUserRecord.id}`);
        const { error: updateAnonError } = await supabase
          .from("users")
          .update({ is_anonymous: false, updated_at: new Date().toISOString() })
          .eq("id", dbUserRecord.id);

        if (updateAnonError) {
          console.error("Error updating anonymous status:", updateAnonError);
          // Don't block; proceed with the user data we have
        } else {
          dbUserRecord.is_anonymous = false; // Update the local object for immediate consistency
        }
      }

      // Final check: Ensure we have a valid dbUserRecord before transforming
      if (!dbUserRecord) {
        console.error(
          "No database user record available after fetch/create operation. Returning null."
        );
        return null;
      }

      // Transform the existing (or newly created/updated) user record to AppUser type
      return transformDatabaseUserToAppUser(dbUserRecord);
    } catch (error) {
      console.error("createOrUpdateUser general error:", error);
      return null;
    }
  };

  /**
   * Checks the current Supabase session and sets the app's user state.
   * If no session or user is found, it attempts to sign in anonymously.
   */
  const checkSession = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Supabase getSession error:", sessionError);
        throw sessionError;
      }

      setSession(session);
      if (session?.user) {
        const profile = await createOrUpdateUser(session.user);
        setUser(profile);
        if (profile) {
          await safeStorage.setItem("current_user_id", profile.id);
          console.log("Auth state changed, user: logged in"); // Log success
        } else {
          console.warn(
            "Auth state changed, user: logged in, but profile fetch/create failed."
          );
        }
      } else {
        console.log(
          "Auth state changed, user: logged out. Attempting anonymous sign-in."
        );
        await signInAnonymously(); // Attempt to sign in anonymously
      }
    } catch (error) {
      console.error("Session check or initial anonymous sign-in error:", error);
      // Fallback to a completely local anonymous user if Supabase anonymous sign-in fails
      const fallbackUser: AppUser = {
        id: `local_fallback_${Date.now()}`, // Unique ID for local-only anonymous user
        email: null,
        is_anonymous: true,
        profile: {
          firstName: null,
          lastName: null,
          age: null,
          gender: null,
          healthGoals: [],
          conditions: [],
          medications: [],
          allergies: [],
          genetics: null,
        },
        preferences: {
          aiResponseStyle: "concise",
          budgetRange: "mid",
          primaryFocus: "safety",
          notifications: {
            push_enabled: true,
            email_enabled: true,
            reminder_frequency: "daily",
          },
        },
        points: undefined, // Default to undefined or empty object
        streaks: undefined, // Default to undefined or empty object
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(fallbackUser);
      console.warn(
        "Operating in local anonymous fallback mode due to session/Supabase anonymous sign-in failure."
      );
    } finally {
      setLoading(false); // Auth is initialized after session check completes
    }
  };

  /**
   * Initializes authentication state and sets up real-time auth change listener.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true); // Ensure loading is true at the very start of init
      await checkSession(); // Perform initial session check

      // Set up listener for future auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event);
        setSession(session);
        setLoading(true); // Set loading while processing auth change

        if (session?.user) {
          const profile = await createOrUpdateUser(session.user);
          setUser(profile);
          if (profile) {
            try {
              await safeStorage.setItem("current_user_id", profile.id);
            } catch (storageError) {
              console.warn(
                "Warning: Failed to save authenticated user ID to AsyncStorage:",
                storageError
              );
            }
          }
          console.log("Auth state changed, user: logged in");
        } else {
          setUser(null); // Clear previous user state immediately
          console.log(
            "Auth state changed, user: logged out. Attempting anonymous sign-in."
          );
          await signInAnonymously(); // Attempt to sign in anonymously
        }

        setLoading(false); // Done processing auth change
      });

      // Cleanup subscription on component unmount
      return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, []); // Empty dependency array ensures this runs once on mount

  /**
   * Signs the user in anonymously with Supabase.
   * If Supabase anonymous sign-in fails, falls back to a local-only anonymous state.
   */
  const signInAnonymously = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error("Supabase anonymous sign-in failed:", error);
        throw error;
      } else if (data.user) {
        const profile = await createOrUpdateUser(data.user);
        setUser(profile);
        if (profile) {
          await safeStorage.setItem("current_user_id", profile.id);
        }
        console.log("Auth state changed, user: logged in (anonymous)");
      }
    } catch (error) {
      console.error("Anonymous sign-in operation error:", error);
      const fallbackUser: AppUser = {
        id: `local_fallback_${Date.now()}`, // Ensure unique ID for local-only anonymous user
        email: null,
        is_anonymous: true,
        profile: {
          firstName: null,
          lastName: null,
          age: null,
          gender: null,
          healthGoals: [],
          conditions: [],
          medications: [],
          allergies: [],
          genetics: null,
        },
        preferences: {
          aiResponseStyle: "concise",
          budgetRange: "mid",
          primaryFocus: "safety",
          notifications: {
            push_enabled: true,
            email_enabled: true,
            reminder_frequency: "daily",
          },
        },
        points: undefined,
        streaks: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(fallbackUser);
      console.warn(
        "Operating in local anonymous fallback mode due to anonymous sign-in failure."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signs in an existing user with email and password.
   * @param email User's email.
   * @param password User's password.
   */
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw {
          message: error.message || "Authentication failed",
          code: error.code || "auth/sign-in-failed",
          originalError: error,
        } as AuthError;
      }

      if (data.user) {
        const profile = await createOrUpdateUser(data.user);
        setUser(profile);
        if (profile) {
          await safeStorage.setItem("current_user_id", profile.id);
        }
        console.log("Auth state changed, user: logged in (email)");
      }
    } catch (error: any) {
      console.error("Email sign in error:", error);
      throw {
        message: error.message || "Could not sign in. Please try again.",
        code: error.code || "auth/unknown-error",
        originalError: error,
      } as AuthError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers a new user with email and password.
   * @param email User's email.
   * @param password User's password.
   */
  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw {
          message: error.message || "Sign up failed",
          code: error.code || "auth/sign-up-failed",
          originalError: error,
        } as AuthError;
      }

      if (data.user) {
        const profile = await createOrUpdateUser(data.user); // createOrUpdateUser will call RPC here
        setUser(profile);
        if (profile) {
          await safeStorage.setItem("current_user_id", profile.id);
        }
        console.log("Auth state changed, user: signed up (email)");
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw {
        message: error.message || "Could not sign up. Please try again.",
        code: error.code || "auth/unknown-error",
        originalError: error,
      } as AuthError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signs out the current user.
   */
  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      // Clear local storage items related to the user
      await safeStorage.multiRemove([
        "current_user_id",
        "pharmaguide_chat_session",
        "pharmaguide_user_stack", // Ensure stack is cleared on sign out
        "pharmaguide_recent_scans", // Clear recent scans
        "pharmaguide_user_streak", // Clear gamification data
        "pharmaguide_user_points", // Clear gamification data
        // Add any other user-specific storage keys here (from APP_CONFIG.STORAGE_KEYS)
      ]);

      // Clear user state first to trigger navigation change
      setUser(null);
      setSession(null);

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase sign out error:", error);
        // Even if there's an error, we've already cleared the local state
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Converts an anonymous user to an email/password user.
   * @param email New email for the account.
   * @param password New password for the account.
   */
  const convertAnonymousToEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    setLoading(true);
    try {
      if (!user?.is_anonymous) {
        throw {
          message: "Only anonymous users can be converted to email users",
          code: "auth/not-anonymous",
        } as AuthError;
      }

      // Update the auth user with email/password
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) {
        throw {
          message: error.message || "Conversion failed",
          code: error.code || "auth/conversion-failed",
          originalError: error,
        } as AuthError;
      }

      if (data.user) {
        // Update the database user record
        const profile = await createOrUpdateUser(data.user);
        setUser(profile);
        if (profile) {
          await safeStorage.setItem("current_user_id", profile.id);
        }
        console.log("Anonymous user converted to email successfully.");
      }
    } catch (error: any) {
      console.error("Convert anonymous error:", error);
      throw {
        message:
          error.message || "Could not convert account. Please try again.",
        code: error.code || "auth/anonymous-conversion-failed",
        originalError: error,
      } as AuthError;
    } finally {
      setLoading(false);
    }
  };

  // Create the context value object with all the auth functions and state
  const value: AuthContextType = {
    user,
    session,
    loading,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    convertAnonymousToEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
