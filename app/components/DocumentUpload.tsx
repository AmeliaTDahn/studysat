import React, { useState, ChangeEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DocumentUploadProps {
  eventId: string;
  onUploadComplete: () => void;
}

export default function DocumentUpload({ eventId, onUploadComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study-documents')
        .upload(`${eventId}/${file.name}`, file);

      if (uploadError) throw uploadError;

      // Create document record in database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: uploadData.path,
          event_id: eventId
        });

      if (dbError) throw dbError;

      setFile(null);
      onUploadComplete();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="document" className="block text-sm font-medium text-gray-700">
          Upload Study Material
        </label>
        <input
          id="document"
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-gray-300"
      >
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
    </div>
  );
} 