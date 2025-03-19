import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Document {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
  isLinked?: boolean;
}

interface DocumentSelectorProps {
  eventId: string;
  onLinkComplete: () => void;
}

interface SelectedDocument {
  id: string;
  importance: number;
  notes: string;
}

export default function DocumentSelector({ eventId, onLinkComplete }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<SelectedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all documents
      const { data: allDocs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Get linked documents for this event
      const { data: linkedDocs, error: linkedError } = await supabase
        .from('calendar_event_documents')
        .select('document_id')
        .eq('event_id', eventId);

      if (linkedError) throw linkedError;

      const linkedDocIds = new Set((linkedDocs || []).map(doc => doc.document_id));

      // Mark documents as linked or not
      const docsWithLinkStatus = (allDocs || []).map(doc => ({
        ...doc,
        isLinked: linkedDocIds.has(doc.id)
      }));

      setDocuments(docsWithLinkStatus);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDocument = (docId: string) => {
    setSelectedDocs(prev => {
      const isSelected = prev.some(doc => doc.id === docId);
      if (isSelected) {
        return prev.filter(doc => doc.id !== docId);
      } else {
        return [...prev, { id: docId, importance: 3, notes: '' }];
      }
    });
  };

  const handleUpdateDocumentSettings = (docId: string, field: 'importance' | 'notes', value: string | number) => {
    setSelectedDocs(prev => 
      prev.map(doc => 
        doc.id === docId 
          ? { ...doc, [field]: value }
          : doc
      )
    );
  };

  const handleLinkDocuments = async () => {
    if (selectedDocs.length === 0) {
      setError('Please select at least one document');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const documentsToLink = selectedDocs.map(doc => ({
        event_id: eventId,
        document_id: doc.id,
        importance: doc.importance,
        notes: doc.notes.trim() || null
      }));

      const { error } = await supabase
        .from('calendar_event_documents')
        .insert(documentsToLink);

      if (error) throw error;

      setSelectedDocs([]);
      onLinkComplete();
      fetchAllDocuments();
    } catch (err) {
      console.error('Error linking documents:', err);
      setError('Failed to link documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !documents.length) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Loading documents...</p>
      </div>
    );
  }

  if (!loading && !documents.length) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No documents available</p>
        <p className="text-sm text-gray-400 mt-1">Upload documents in the Resources section first</p>
      </div>
    );
  }

  const availableDocuments = documents.filter(doc => !doc.isLinked);

  return (
    <div className="space-y-4">
      {documents.some(doc => doc.isLinked) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Already Linked Documents:</h4>
          <ul className="text-sm text-gray-500 space-y-1">
            {documents.filter(doc => doc.isLinked).map(doc => (
              <li key={doc.id} className="flex items-center">
                <span className="mr-2">•</span>
                {doc.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {availableDocuments.length > 0 && (
        <>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Documents:</h4>
            <div className="space-y-2">
              {availableDocuments.map(doc => {
                const isSelected = selectedDocs.some(selected => selected.id === doc.id);
                const selectedDoc = selectedDocs.find(selected => selected.id === doc.id);

                return (
                  <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id={`doc-${doc.id}`}
                        checked={isSelected}
                        onChange={() => handleToggleDocument(doc.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <label htmlFor={`doc-${doc.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                        {doc.name}
                      </label>
                    </div>

                    {isSelected && (
                      <div className="ml-7 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Importance
                          </label>
                          <select
                            value={selectedDoc?.importance}
                            onChange={(e) => handleUpdateDocumentSettings(doc.id, 'importance', parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                          >
                            <option value="1">Low</option>
                            <option value="2">Medium-Low</option>
                            <option value="3">Medium</option>
                            <option value="4">Medium-High</option>
                            <option value="5">High</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={selectedDoc?.notes}
                            onChange={(e) => handleUpdateDocumentSettings(doc.id, 'notes', e.target.value)}
                            placeholder="Add any notes about why this document is relevant..."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleLinkDocuments}
            disabled={selectedDocs.length === 0 || loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-gray-300"
          >
            {loading ? 'Linking...' : `Link ${selectedDocs.length} Document${selectedDocs.length !== 1 ? 's' : ''}`}
          </button>
        </>
      )}
    </div>
  );
} 