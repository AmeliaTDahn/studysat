import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function uploadDocument(file: File, subjectId: string) {
  const supabase = createClientComponentClient();
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`${user.id}/${fileName}`, file);
    
    if (uploadError) throw uploadError;

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(`${user.id}/${fileName}`);

    // Create document record in the database
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        subject_id: subjectId,
        user_id: user.id
      })
      .select()
      .single();

    if (documentError) throw documentError;
    
    return document;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

export async function getDocuments(subjectId?: string) {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data: documents, error: documentsError } = await query
      .order('created_at', { ascending: false });

    if (documentsError) throw documentsError;
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

export async function deleteDocument(documentId: string) {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    // Get the document to find its file URL
    const { data: document, error: getError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (getError) throw getError;

    // Delete the file from storage
    const filePath = document.file_url.split('/').pop();
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([`${user.id}/${filePath}`]);

    if (storageError) throw storageError;

    // Delete the document record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
} 