// src/services/submission/submissionService.ts
import { supabase } from '../supabase/client';
import { gamificationService } from '../gamification/gamificationService';

interface ProductSubmission {
  id?: string;
  user_id: string;
  product_name: string;
  brand: string;
  category: string;
  barcode?: string;
  photos: {
    front?: string;
    back?: string;
    ingredients?: string;
    nutrition?: string;
  };
  manual_ingredients?: string;
  serving_size?: string;
  servings_per_container?: string;
  directions?: string;
  warnings?: string;
  status: 'pending' | 'approved' | 'rejected';
  moderator_notes?: string;
  created_at: string;
  updated_at: string;
}

interface SubmissionStats {
  total_submissions: number;
  approved_submissions: number;
  pending_submissions: number;
  rejected_submissions: number;
  points_earned: number;
}

class SubmissionService {
  /**
   * Submit a new product for review
   */
  async submitProduct(submissionData: Omit<ProductSubmission, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Upload photos to storage
      const uploadedPhotos = await this.uploadPhotos(submissionData.photos, user.id);

      // Create submission record
      const submission: Omit<ProductSubmission, 'id'> = {
        user_id: user.id,
        product_name: submissionData.product_name,
        brand: submissionData.brand,
        category: submissionData.category,
        barcode: submissionData.barcode,
        photos: uploadedPhotos,
        manual_ingredients: submissionData.manual_ingredients,
        serving_size: submissionData.serving_size,
        servings_per_container: submissionData.servings_per_container,
        directions: submissionData.directions,
        warnings: submissionData.warnings,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('product_submissions')
        .insert(submission)
        .select()
        .single();

      if (error) {
        console.error('Submission insert error:', error);
        return { success: false, error: 'Failed to submit product' };
      }

      // Award points for submission
      await gamificationService.awardPoints(user.id, 'DATA_SUBMISSION');

      return { success: true, submissionId: data.id };
    } catch (error) {
      console.error('Product submission failed:', error);
      return { success: false, error: 'Submission failed' };
    }
  }

  /**
   * Upload photos to Supabase storage
   */
  private async uploadPhotos(photos: Record<string, string>, userId: string): Promise<Record<string, string>> {
    const uploadedPhotos: Record<string, string> = {};

    for (const [type, uri] of Object.entries(photos)) {
      if (uri) {
        try {
          const fileName = `${userId}/${Date.now()}_${type}.jpg`;
          
          // Convert image URI to blob for upload
          const response = await fetch(uri);
          const blob = await response.blob();

          const { data, error } = await supabase.storage
            .from('product-submissions')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (error) {
            console.error(`Failed to upload ${type} photo:`, error);
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('product-submissions')
            .getPublicUrl(fileName);

          uploadedPhotos[type] = publicUrl;
        } catch (error) {
          console.error(`Error uploading ${type} photo:`, error);
        }
      }
    }

    return uploadedPhotos;
  }

  /**
   * Get user's submission history
   */
  async getUserSubmissions(userId: string): Promise<ProductSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('product_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch user submissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      return [];
    }
  }

  /**
   * Get user's submission statistics
   */
  async getUserSubmissionStats(userId: string): Promise<SubmissionStats> {
    try {
      const submissions = await this.getUserSubmissions(userId);
      
      const stats: SubmissionStats = {
        total_submissions: submissions.length,
        approved_submissions: submissions.filter(s => s.status === 'approved').length,
        pending_submissions: submissions.filter(s => s.status === 'pending').length,
        rejected_submissions: submissions.filter(s => s.status === 'rejected').length,
        points_earned: 0, // Will be calculated from gamification service
      };

      // Calculate points earned from approved submissions
      stats.points_earned = stats.approved_submissions * 50; // 50 points per approved submission

      return stats;
    } catch (error) {
      console.error('Error calculating submission stats:', error);
      return {
        total_submissions: 0,
        approved_submissions: 0,
        pending_submissions: 0,
        rejected_submissions: 0,
        points_earned: 0,
      };
    }
  }

  /**
   * Get submissions for moderation (admin only)
   */
  async getSubmissionsForModeration(status: 'pending' | 'all' = 'pending'): Promise<ProductSubmission[]> {
    try {
      let query = supabase
        .from('product_submissions')
        .select('*')
        .order('created_at', { ascending: true });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch submissions for moderation:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching submissions for moderation:', error);
      return [];
    }
  }

  /**
   * Moderate a submission (admin only)
   */
  async moderateSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    moderatorNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('product_submissions')
        .update({
          status,
          moderator_notes: moderatorNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) {
        console.error('Failed to moderate submission:', error);
        return { success: false, error: 'Failed to update submission' };
      }

      // If approved, award additional points to the user
      if (status === 'approved') {
        await gamificationService.awardPoints(data.user_id, 'DATA_VERIFICATION');
      }

      return { success: true };
    } catch (error) {
      console.error('Error moderating submission:', error);
      return { success: false, error: 'Moderation failed' };
    }
  }

  /**
   * Convert approved submission to product
   */
  async convertSubmissionToProduct(submissionId: string): Promise<{ success: boolean; productId?: string; error?: string }> {
    try {
      const { data: submission, error: fetchError } = await supabase
        .from('product_submissions')
        .select('*')
        .eq('id', submissionId)
        .eq('status', 'approved')
        .single();

      if (fetchError || !submission) {
        return { success: false, error: 'Submission not found or not approved' };
      }

      // Create product from submission
      const product = {
        name: submission.product_name,
        brand: submission.brand,
        category: submission.category,
        barcode: submission.barcode,
        serving_size: submission.serving_size,
        servings_per_container: submission.servings_per_container ? parseInt(submission.servings_per_container) : null,
        directions: submission.directions,
        warnings: submission.warnings,
        image_url: submission.photos.front,
        verified: false, // User-submitted products start as unverified
        third_party_tested: false,
        source: 'user_submission',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create product from submission:', insertError);
        return { success: false, error: 'Failed to create product' };
      }

      return { success: true, productId: newProduct.id };
    } catch (error) {
      console.error('Error converting submission to product:', error);
      return { success: false, error: 'Conversion failed' };
    }
  }

  /**
   * Delete a submission
   */
  async deleteSubmission(submissionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('product_submissions')
        .delete()
        .eq('id', submissionId);

      if (error) {
        console.error('Failed to delete submission:', error);
        return { success: false, error: 'Failed to delete submission' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting submission:', error);
      return { success: false, error: 'Deletion failed' };
    }
  }
}

export const submissionService = new SubmissionService();
export type { ProductSubmission, SubmissionStats };
