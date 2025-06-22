// src/services/supabase/__tests__/client.test.ts
import { callEdgeFunction } from '../client';

// Mock the supabase client
jest.mock('../client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
  callEdgeFunction: jest.fn(),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callEdgeFunction', () => {
    it('should call supabase functions.invoke with correct parameters', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: { result: 'success' },
        error: null,
      });

      // Re-import to get fresh mock
      jest.doMock('../client', () => ({
        supabase: {
          functions: {
            invoke: mockInvoke,
          },
        },
        callEdgeFunction: jest.requireActual('../client').callEdgeFunction,
      }));

      const { callEdgeFunction: actualCallEdgeFunction } = require('../client');
      
      const result = await actualCallEdgeFunction('test-function', { test: 'data' });

      expect(mockInvoke).toHaveBeenCalledWith('test-function', {
        body: { test: 'data' },
        headers: undefined,
      });
      expect(result).toEqual({ result: 'success' });
    });

    it('should handle function errors', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Function error'),
      });

      jest.doMock('../client', () => ({
        supabase: {
          functions: {
            invoke: mockInvoke,
          },
        },
        callEdgeFunction: jest.requireActual('../client').callEdgeFunction,
      }));

      const { callEdgeFunction: actualCallEdgeFunction } = require('../client');

      await expect(
        actualCallEdgeFunction('test-function', { test: 'data' })
      ).rejects.toThrow('Function error');
    });

    it('should pass custom headers', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: { result: 'success' },
        error: null,
      });

      jest.doMock('../client', () => ({
        supabase: {
          functions: {
            invoke: mockInvoke,
          },
        },
        callEdgeFunction: jest.requireActual('../client').callEdgeFunction,
      }));

      const { callEdgeFunction: actualCallEdgeFunction } = require('../client');

      await actualCallEdgeFunction(
        'test-function',
        { test: 'data' },
        { headers: { 'Custom-Header': 'value' } }
      );

      expect(mockInvoke).toHaveBeenCalledWith('test-function', {
        body: { test: 'data' },
        headers: { 'Custom-Header': 'value' },
      });
    });
  });

  describe('Supabase Configuration', () => {
    it('should be configured with environment variables', () => {
      // Test that the client is properly configured
      // This is more of an integration test to ensure the client initializes
      const { supabase } = require('../client');
      expect(supabase).toBeDefined();
      expect(supabase.functions).toBeDefined();
    });
  });
});
