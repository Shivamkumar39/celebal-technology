import { supabase } from '../lib/supabase';

export class FileTransferService {
  static async createTransfer(recipientEmail, fileName, fileSize, fileType, file) {
    try {
      console.log('Starting file transfer process...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('User authenticated:', user.email);

      // First, ensure the storage bucket exists and is properly configured
      await this.ensureStorageBucket();

      // Upload file to Supabase Storage
      const fileExt = fileName.split('.').pop() || 'bin';
      const timestamp = Date.now();
      const filePath = `transfers/${user.id}/${timestamp}_${fileName}`;
      
      console.log('Uploading file to path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('file-transfers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: `Failed to upload file: ${uploadError.message}` };
      }

      console.log('File uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('file-transfers')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);

      // Create transfer record
      const transferData = {
        sender_id: user.id,
        recipient_email: recipientEmail,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        file_url: publicUrl,
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
      };

      console.log('Creating transfer record:', transferData);

      const { data: transfer, error: dbError } = await supabase
        .from('file_transfers')
        .insert(transferData)
        .select(`
          *,
          sender:profiles(*)
        `)
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('file-transfers')
          .remove([filePath]);
        return { success: false, error: `Failed to create transfer record: ${dbError.message}` };
      }

      console.log('Transfer record created:', transfer);

      // Create notification for recipient
      try {
        await supabase
          .from('transfer_notifications')
          .insert({
            transfer_id: transfer.id,
            recipient_email: recipientEmail,
            message: `You received a file: ${fileName} from ${transfer.sender?.name || user.email}`,
          });
        console.log('Notification created successfully');
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the transfer if notification fails
      }

      return { success: true, transfer };
    } catch (error) {
      console.error('Transfer error:', error);
      return { success: false, error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  static async ensureStorageBucket() {
    try {
      console.log('Checking storage bucket...');
      
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'file-transfers');
      
      if (!bucketExists) {
        console.log('Creating storage bucket...');
        
        const { data: bucket, error: createError } = await supabase.storage.createBucket('file-transfers', {
          public: true,
          allowedMimeTypes: ['*/*'],
          fileSizeLimit: 1024 * 1024 * 100 // 100MB limit
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log('Storage bucket created successfully:', bucket);
        }
      } else {
        console.log('Storage bucket already exists');
      }
    } catch (error) {
      console.error('Error ensuring storage bucket:', error);
    }
  }

  static async getUserTransfers(userId) {
    try {
      console.log('Fetching user transfers for:', userId);
      
      const { data, error } = await supabase
        .from('file_transfers')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transfers:', error);
        return [];
      }

      console.log('User transfers fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getUserTransfers:', error);
      return [];
    }
  }

  static async getReceivedTransfers(userEmail) {
    try {
      console.log('Fetching received transfers for:', userEmail);
      
      const { data, error } = await supabase
        .from('file_transfers')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('recipient_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching received transfers:', error);
        return [];
      }

      console.log('Received transfers fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getReceivedTransfers:', error);
      return [];
    }
  }

  static async downloadFile(transferId) {
    try {
      console.log('Downloading file for transfer:', transferId);
      
      const { data: transfer, error } = await supabase
        .from('file_transfers')
        .select('file_url, file_name')
        .eq('id', transferId)
        .single();

      if (error || !transfer) {
        console.error('Transfer not found:', error);
        return { success: false, error: 'Transfer not found' };
      }

      if (!transfer.file_url) {
        console.error('File URL not available for transfer:', transferId);
        return { success: false, error: 'File URL not available' };
      }

      console.log('File download URL retrieved:', transfer.file_url);
      return { success: true, url: transfer.file_url };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: 'Failed to download file' };
    }
  }

  static async getTransferNotifications(userEmail) {
    try {
      const { data, error } = await supabase
        .from('transfer_notifications')
        .select(`
          *,
          transfer:file_transfers(
            *,
            sender:profiles(*)
          )
        `)
        .eq('recipient_email', userEmail)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTransferNotifications:', error);
      return [];
    }
  }

  static async markNotificationAsRead(notificationId) {
    try {
      await supabase
        .from('transfer_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}