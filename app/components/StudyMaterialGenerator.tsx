import React, { useState, useEffect } from 'react';
import { FaSpinner, FaBook, FaQuestionCircle, FaClipboard, FaProjectDiagram, FaLightbulb, FaStar } from 'react-icons/fa';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  subject_name: string | null;
  documents: Array<{
    id: string;
    name: string;
    content_text?: string;
    importance?: number;
    notes?: string;
  }>;
}

interface StudyMaterialGeneratorProps {
  event: Event;
  onGenerate: (description: string) => void;
}

type StudyMaterialType = 'flashcards' | 'quiz' | 'notes' | 'mindmap' | 'summary';

interface StudyMaterialOption {
  id: StudyMaterialType;
  title: string;
  description: string;
  icon: React.ReactNode;
  suitableFor: string[];
  recommendedFor?: {
    contentTypes: string[];
    reason: string;
  };
}

interface StudyMethod {
  name: string;
  application: string[];
  rationale: string;
}

const studyMaterialOptions: StudyMaterialOption[] = [
  {
    id: 'summary',
    title: 'Study Summary',
    description: 'Condensed overview with key points and examples',
    icon: <FaLightbulb className="w-6 h-6" />,
    suitableFor: ['Review', 'Main Points', 'Key Ideas'],
    recommendedFor: {
      contentTypes: ['overview', 'review', 'main points', 'key ideas'],
      reason: 'Excellent for final review and consolidation'
    }
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Interactive flashcards for active recall and spaced repetition',
    icon: <FaBook className="w-6 h-6" />,
    suitableFor: ['Key Terms', 'Definitions', 'Concepts', 'Facts'],
    recommendedFor: {
      contentTypes: ['definitions', 'concepts', 'terms', 'facts'],
      reason: 'Great for memorizing key terms and concepts'
    }
  },
  {
    id: 'quiz',
    title: 'Practice Quiz',
    description: 'Self-assessment questions to test understanding',
    icon: <FaQuestionCircle className="w-6 h-6" />,
    suitableFor: ['Understanding Check', 'Application', 'Critical Thinking'],
    recommendedFor: {
      contentTypes: ['analysis', 'application', 'examples', 'case studies'],
      reason: 'Ideal for testing deep understanding and application'
    }
  },
  {
    id: 'notes',
    title: 'Smart Notes',
    description: 'Structured notes with key concepts and examples',
    icon: <FaClipboard className="w-6 h-6" />,
    suitableFor: ['Complex Topics', 'Processes', 'Methods', 'Steps'],
    recommendedFor: {
      contentTypes: ['processes', 'methods', 'steps', 'procedures'],
      reason: 'Best for organizing complex information and procedures'
    }
  },
  {
    id: 'mindmap',
    title: 'Mind Map',
    description: 'Visual representation of concepts and relationships',
    icon: <FaProjectDiagram className="w-6 h-6" />,
    suitableFor: ['Relationships', 'Connections', 'Big Picture'],
    recommendedFor: {
      contentTypes: ['relationships', 'connections', 'systems', 'hierarchies'],
      reason: 'Perfect for visualizing connections between concepts'
    }
  }
];

// Map study methods to recommended study materials
const methodToMaterialMap: Record<string, StudyMaterialType[]> = {
  'Retrieval Practice': ['flashcards', 'quiz'],
  'Active Recall': ['flashcards', 'quiz'],
  'Spaced Practice': ['flashcards', 'quiz'],
  'Interleaved Practice': ['quiz', 'notes'],
  'Elaboration': ['notes', 'mindmap'],
  'Dual Coding': ['mindmap', 'notes'],
  'Concrete Examples': ['notes', 'quiz'],
  'Self-Testing': ['quiz', 'flashcards'],
  'Summary Creation': ['summary', 'mindmap']
};

export default function StudyMaterialGenerator({
  event,
  onGenerate
}: StudyMaterialGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<StudyMaterialType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [studyMethods, setStudyMethods] = useState<StudyMethod[]>([]);

  useEffect(() => {
    // Parse study methods from event description
    if (event.description?.includes('Study Methods:')) {
      const methods = event.description
        .split('Study Methods:')[1]
        .split('---')
        .map(method => {
          const [methodName, ...details] = method.trim().split('\n');
          const applicationStart = details.indexOf('Step-by-Step Application:');
          const rationaleStart = details.indexOf('Why This Method Works:');
          
          return {
            name: methodName.trim(),
            application: details
              .slice(applicationStart + 1, rationaleStart)
              .filter(line => line.trim().startsWith('•'))
              .map(line => line.trim().substring(2)),
            rationale: details
              .slice(rationaleStart + 1)
              .join('\n')
              .trim()
          };
        })
        .filter(method => method.name && method.application.length > 0);
      
      setStudyMethods(methods);
    }
  }, [event.description]);

  // Analyze content to determine recommended study materials
  const analyzeContent = () => {
    const contentText = [
      event.title,
      event.description,
      ...(event.subject_name ? [event.subject_name] : [])
    ].join(' ').toLowerCase();

    // Get recommended materials based on study methods
    const methodBasedRecommendations = new Set<StudyMaterialType>();
    studyMethods.forEach(method => {
      const methodName = method.name.toLowerCase();
      Object.entries(methodToMaterialMap).forEach(([key, materials]) => {
        if (methodName.includes(key.toLowerCase())) {
          // Only add the first two most relevant materials for each method
          materials.slice(0, 2).forEach(material => methodBasedRecommendations.add(material));
        }
      });
    });

    // Score each material type based on content analysis and study methods
    return studyMaterialOptions.map(option => {
      let score = 0;
      let specificReason = '';

      // Add score for method-based recommendations
      if (methodBasedRecommendations.has(option.id)) {
        score += 5;
        const relevantMethods = studyMethods
          .filter(method => 
            Object.entries(methodToMaterialMap)
              .some(([key, materials]) => 
                materials.includes(option.id) && 
                method.name.toLowerCase().includes(key.toLowerCase())
              )
          )
          .map(method => method.name);
        
        if (relevantMethods.length > 0) {
          specificReason = `Recommended for ${relevantMethods.join(' and ')} study methods`;
        }
      }

      // Check for content type matches
      option.recommendedFor?.contentTypes.forEach(type => {
        if (contentText.includes(type)) {
          score += 2;
        }
      });

      // Check for suitability matches
      option.suitableFor.forEach(type => {
        if (contentText.includes(type.toLowerCase())) {
          score += 1;
        }
      });

      // Add specific recommendations based on content
      if (!specificReason) {
        if (option.id === 'mindmap' && contentText.includes('relationship')) {
          score += 3;
          specificReason = 'Content involves many relationships between concepts';
        }

        if (option.id === 'quiz' && (contentText.includes('understand') || contentText.includes('apply'))) {
          score += 3;
          specificReason = 'Content requires deep understanding and application';
        }

        if (option.id === 'flashcards' && (contentText.includes('define') || contentText.includes('term'))) {
          score += 3;
          specificReason = 'Content contains many key terms and definitions';
        }
      }

      return {
        ...option,
        recommendationScore: score,
        specificReason: specificReason || option.recommendedFor?.reason
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .map((option, index) => ({
      ...option,
      // Only recommend if it's either:
      // 1. One of the top 2 method-based recommendations
      // 2. Has a very high content-based score (>5) and is in the top 2
      isRecommended: (methodBasedRecommendations.has(option.id) && index < 2) || 
                    (!methodBasedRecommendations.has(option.id) && option.recommendationScore > 5 && index < 2)
    }));
  };

  const recommendedMaterials = analyzeContent();

  const handleGenerate = async () => {
    setError(null);
    console.log('Starting generation with event:', event);
    
    if (!event.documents || event.documents.length === 0) {
      setError('No documents available to generate study materials from');
      console.error('No documents available for study material generation');
      return;
    }
    
    setIsGenerating(true);
    try {
      console.log('Sending request with documents:', event.documents);
      
      const response = await fetch('/api/study-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          documents: event.documents,
          eventDate: event.event_date,
          selectedMaterials: selectedMaterials,
          studyMethods: studyMethods
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate study materials');
      }

      if (!data.suggestions?.[0]?.description) {
        throw new Error('No study materials were generated');
      }

      onGenerate(data.suggestions[0].description);
    } catch (error) {
      console.error('Error generating study materials:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate study materials');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleMaterial = (materialType: StudyMaterialType) => {
    setSelectedMaterials(prev => {
      const newSelection = prev.includes(materialType)
        ? prev.filter(type => type !== materialType)
        : [...prev, materialType];
      return newSelection;
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg">
        <div className="grid gap-4">
          {recommendedMaterials.map((option) => (
            <div
              key={option.id}
              onClick={() => toggleMaterial(option.id)}
              className={`
                border rounded-lg p-4 transition duration-200 cursor-pointer
                ${selectedMaterials.includes(option.id)
                  ? 'border-blue-500 bg-blue-50'
                  : option.isRecommended
                  ? 'border-blue-200 bg-blue-50/50 hover:border-blue-300'
                  : 'border-gray-200 hover:border-blue-300'}
              `}
            >
              <div className="flex items-start space-x-4">
                <div className={`${
                  selectedMaterials.includes(option.id)
                    ? 'text-blue-600'
                    : option.isRecommended
                    ? 'text-blue-500'
                    : 'text-gray-500'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{option.title}</h3>
                    {option.isRecommended && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FaStar className="w-3 h-3 mr-1" />
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  {option.specificReason && option.isRecommended && (
                    <p className="text-sm text-blue-700 mt-1">
                      {option.specificReason}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {option.suitableFor.map((method) => (
                      <span
                        key={method}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedMaterials.length === 0 || !event.documents || event.documents.length === 0}
          className={`
            flex items-center justify-center px-8 py-3 rounded-lg
            text-white font-medium transition duration-200
            ${isGenerating
              ? 'bg-blue-400 cursor-not-allowed'
              : selectedMaterials.length > 0 && event.documents && event.documents.length > 0
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'}
          `}
        >
          {isGenerating ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Generating...
            </>
          ) : (
            'Generate Study Summary'
          )}
        </button>
      </div>
    </div>
  );
} 