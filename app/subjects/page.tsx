"use client";

import React, { useState, useEffect } from 'react';
import { Playfair_Display, Poppins } from 'next/font/google';
import Navigation from '../components/Navigation';
import { FaUpload, FaBook, FaFile, FaTrash } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { uploadDocument, getDocuments, deleteDocument } from '../lib/documents';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

interface Subject {
  id: string;
  name: string;
}

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchDocuments(selectedSubject);
    }
  }, [selectedSubject]);

  async function fetchSubjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: subjects, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setSubjects(subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocuments(subjectId: string) {
    try {
      const docs = await getDocuments(subjectId);
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedSubject) return;

    setUploading(true);
    setError(null);

    try {
      await uploadDocument(file, selectedSubject);
      await fetchDocuments(selectedSubject);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!selectedSubject) return;

    try {
      await deleteDocument(documentId);
      await fetchDocuments(selectedSubject);
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  }

  async function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: subject, error } = await supabase
        .from('subjects')
        .insert({ name: newSubjectName.trim(), user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setSubjects([...subjects, subject]);
      setNewSubjectName('');
      setShowNewSubjectInput(false);
    } catch (error) {
      console.error('Error creating subject:', error);
      setError('Failed to create subject');
    }
  }

  function formatFileSize(bytes: number) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div className={poppins.className}>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className={`${playfair.className} text-4xl font-bold text-gray-900`}>
              Your Study Materials
            </h1>
            <button
              onClick={() => setShowUploadModal(true)}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                selectedSubject 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!selectedSubject}
              title={!selectedSubject ? "Please select a subject first" : "Upload a document"}
            >
              <FaUpload className="mr-2" />
              Upload Document
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Subjects List */}
            <div className="col-span-1 bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Subjects</h2>
                <button
                  onClick={() => setShowNewSubjectInput(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  + Add Subject
                </button>
              </div>

              {showNewSubjectInput && (
                <form onSubmit={handleCreateSubject} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Subject name"
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition duration-200 ${
                      selectedSubject === subject.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <FaBook className="mr-3" />
                      <span>{subject.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Documents List */}
            <div className="col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Documents</h2>
              {!selectedSubject ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <FaBook className="w-12 h-12 mx-auto mb-2" />
                  </div>
                  <p className="text-gray-600 text-lg mb-2">Select a subject to view documents</p>
                  <p className="text-gray-500">
                    {subjects.length === 0 
                      ? "Start by creating a subject using the '+ Add Subject' button"
                      : "Click on a subject from the list on the left"}
                  </p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No documents uploaded yet
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <FaFile className="text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-semibold mb-4">Upload Document</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="w-full p-2 border rounded-lg"
                    disabled={uploading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX
                  </p>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  {uploading && (
                    <div className="text-blue-600">Uploading...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 