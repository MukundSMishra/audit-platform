import { supabase } from './supabaseClient';

export const uploadEvidence = async (file, auditId) => {
  if (!file) return null;

  // 1. Sanitize Filename (Remove spaces & special chars to avoid URL errors)
  const fileExt = file.name.split('.').pop();
  const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_'); 
  // Result: 1715000000_my_photo.jpg
  const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
  
  // 2. Define the Path: FACT-06-01/filename.jpg
  const filePath = `${auditId}/${fileName}`;

  // 3. Upload to Supabase Bucket
  const { data, error } = await supabase
    .storage
    .from('audit-evidence') // Must match your bucket name exactly
    .upload(filePath, file);

  if (error) {
    console.error('Upload Error:', error);
    throw error;
  }

  // 4. Get the Public URL (For the PDF report)
  const { data: publicData } = supabase
    .storage
    .from('audit-evidence')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
};