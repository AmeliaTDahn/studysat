import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { parseFromBuffer as parsePptx } from 'pptx-text';

export interface ProcessedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    title?: string;
    author?: string;
    creationDate?: Date;
  };
}

async function fetchAndProcessDocument(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

async function processPdf(buffer: ArrayBuffer): Promise<ProcessedDocument> {
  const data = await pdfParse(Buffer.from(buffer));
  return {
    text: data.text,
    metadata: {
      pageCount: data.numpages,
      title: data.info?.Title,
      author: data.info?.Author,
      creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined
    }
  };
}

async function processDocx(buffer: ArrayBuffer): Promise<ProcessedDocument> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return {
    text: result.value,
    metadata: {
      // Mammoth doesn't provide metadata directly
    }
  };
}

async function processPptx(buffer: ArrayBuffer): Promise<ProcessedDocument> {
  const text = await parsePptx(Buffer.from(buffer));
  return {
    text,
    metadata: {
      // PPTX parser doesn't provide metadata directly
    }
  };
}

export async function processDocument(url: string, fileType: string): Promise<ProcessedDocument> {
  try {
    const buffer = await fetchAndProcessDocument(url);

    switch (fileType.toLowerCase()) {
      case 'application/pdf':
      case 'pdf':
        return processPdf(buffer);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'docx':
        return processDocx(buffer);
      
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'pptx':
        return processPptx(buffer);
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

// Helper function to extract key terms and concepts
export function extractKeyTerms(text: string): string[] {
  // This is a basic implementation - could be enhanced with NLP libraries
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);  // Filter out short words
  
  // Count word frequencies
  const wordFreq = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort by frequency and get top terms
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}

// Helper function to generate a summary
export function generateSummary(text: string, maxLength: number = 500): string {
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  // Basic scoring - prefer sentences with key terms and at the start of the document
  const keyTerms = new Set(extractKeyTerms(text));
  const scoredSentences = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().split(/\s+/);
    const keyTermCount = words.filter(word => keyTerms.has(word)).length;
    const positionScore = 1 - (index / sentences.length);
    return {
      sentence,
      score: keyTermCount * 0.6 + positionScore * 0.4
    };
  });

  // Sort by score and combine until we reach maxLength
  let summary = '';
  const sortedSentences = scoredSentences
    .sort((a, b) => b.score - a.score);

  for (const { sentence } of sortedSentences) {
    if ((summary + sentence).length <= maxLength) {
      summary += sentence + ' ';
    } else {
      break;
    }
  }

  return summary.trim();
} 