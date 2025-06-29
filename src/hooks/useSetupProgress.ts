// src/hooks/useSetupProgress.ts
// Unified Progress Manager for Health Profile Setup Flow
// Consolidates AsyncStorage and localHealthProfileService state management

import { useState, useEffect, useCallback } from 'react';
import { unifiedStorage } from '../services/storage/unifiedStorageService';
import { logger } from '../services/monitoring/logger';
import type { ProfileSetupStep, ConsentType } from '../types/healthProfile';

export interface SetupStep {
  id: string;
  title: string;
  completed: boolean;
  required: boolean;
}

export interface SetupProgress {
  currentStep: number;
  steps: SetupStep[];
  data: Record<string, any>;
  consents: Record<ConsentType, boolean>;
}

const DEFAULT_STEPS: SetupStep[] = [
  { id: 'privacy_consent', title: 'Privacy & Consent', completed: false, required: true },
  { id: 'demographics', title: 'Demographics', completed: false, required: true },
  { id: 'health_goals', title: 'Health Goals', completed: false, required: true },
  { id: 'health_conditions', title: 'Health Conditions', completed: false, required: false },
  { id: 'allergies', title: 'Allergies', completed: false, required: false },
];

export const useSetupProgress = () => {
  const [progress, setProgress] = useState<SetupProgress>({
    currentStep: 0,
    steps: DEFAULT_STEPS,
    data: {},
    consents: {} as Record<ConsentType, boolean>,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await unifiedStorage.getItem('setup_progress');
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          setProgress(parsed);
        }
      } catch (error) {
        logger.error('database', 'Failed to load setup progress', error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  const updateStep = useCallback(async (stepId: string, completed: boolean, data?: any) => {
    setProgress(prev => {
      const updatedSteps = prev.steps.map(step =>
        step.id === stepId ? { ...step, completed } : step
      );
      
      const updatedData = data ? { ...prev.data, [stepId]: data } : prev.data;
      
      const newProgress = {
        ...prev,
        steps: updatedSteps,
        data: updatedData,
        currentStep: completed ? prev.currentStep + 1 : prev.currentStep,
      };

      // Persist to unified storage
      unifiedStorage.setItem('setup_progress', JSON.stringify(newProgress))
        .catch(error => {
          logger.error('database', 'Failed to save setup progress', error as Error);
        });

      return newProgress;
    });
  }, []);

  const updateFormData = useCallback(async (stepId: string, data: any) => {
    setProgress(prev => {
      const newProgress = {
        ...prev,
        data: { ...prev.data, [stepId]: data },
      };

      // Persist to unified storage
      unifiedStorage.setItem('setup_progress', JSON.stringify(newProgress))
        .catch(error => {
          logger.error('database', 'Failed to save form data', error as Error);
        });

      return newProgress;
    });
  }, []);

  const updateConsents = useCallback(async (consents: Record<ConsentType, boolean>) => {
    setProgress(prev => {
      const newProgress = {
        ...prev,
        consents,
      };

      // Persist to unified storage
      unifiedStorage.setItem('setup_progress', JSON.stringify(newProgress))
        .catch(error => {
          logger.error('database', 'Failed to save consents', error as Error);
        });

      return newProgress;
    });
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      const savedProgress = await unifiedStorage.getItem('setup_progress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setProgress(parsed);
      }
    } catch (error) {
      logger.error('database', 'Failed to load setup progress', error as Error);
    }
  }, []);

  const saveProgress = useCallback(async () => {
    try {
      await unifiedStorage.setItem('setup_progress', JSON.stringify(progress));
    } catch (error) {
      logger.error('database', 'Failed to save setup progress', error as Error);
    }
  }, [progress]);

  const clearProgress = useCallback(async () => {
    const resetProgress = {
      currentStep: 0,
      steps: DEFAULT_STEPS,
      data: {},
      consents: {} as Record<ConsentType, boolean>,
    };

    setProgress(resetProgress);
    
    try {
      await unifiedStorage.setItem('setup_progress', JSON.stringify(resetProgress));
    } catch (error) {
      logger.error('database', 'Failed to reset setup progress', error as Error);
    }
  }, []);

  const resetProgress = useCallback(async () => {
    await clearProgress();
  }, [clearProgress]);

  const getStepData = useCallback((stepId: string) => {
    return progress.data[stepId] || null;
  }, [progress.data]);

  const isStepCompleted = useCallback((stepId: string) => {
    const step = progress.steps.find(s => s.id === stepId);
    return step?.completed || false;
  }, [progress.steps]);

  const getCompletedSteps = useCallback(() => {
    return progress.steps.filter(step => step.completed);
  }, [progress.steps]);

  const getRemainingSteps = useCallback(() => {
    return progress.steps.filter(step => !step.completed);
  }, [progress.steps]);

  const isSetupComplete = useCallback(() => {
    const requiredSteps = progress.steps.filter(step => step.required);
    return requiredSteps.every(step => step.completed);
  }, [progress.steps]);

  return {
    progress,
    isLoading,
    updateStep,
    updateFormData,
    updateConsents,
    loadProgress,
    saveProgress,
    clearProgress,
    resetProgress,
    getStepData,
    isStepCompleted,
    getCompletedSteps,
    getRemainingSteps,
    isSetupComplete,
  };
}; 