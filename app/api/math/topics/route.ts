import { NextRequest, NextResponse } from 'next/server';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const difficulty = searchParams.get('difficulty') || 'medium';

    // Call Python service
    const pythonScript = `
import sys
import json
sys.path.append('${process.cwd()}/app/api/services')
from question_service import QuestionService

service = QuestionService()
topics = service.get_available_topics('${difficulty}')
print(json.dumps(topics))
`;

    const { stdout, stderr } = await exec(`python3 -c "${pythonScript}"`);
    
    if (stderr) {
      console.error('Python error:', stderr);
      return NextResponse.json({ error: 'Failed to get topics' }, { status: 500 });
    }

    const topics = JSON.parse(stdout);
    return NextResponse.json(topics);

  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 