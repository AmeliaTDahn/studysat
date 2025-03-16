import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

// Helper function to run Python script and get output
async function runPythonScript(scriptPath: string, args: string[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptPath, ...args]);
    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}: ${error}`));
      } else {
        try {
          resolve(JSON.parse(result));
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${result}`));
        }
      }
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty') || 'medium';

    // Get the absolute path to the Python script
    const scriptPath = path.join(process.cwd(), 'app', 'api', 'services', 'get_question.py');

    // Run the Python script with topic and difficulty arguments
    const args = [
      '--topic', topic || '',
      '--difficulty', difficulty
    ];

    const question = await runPythonScript(scriptPath, args);

    if (!question) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error in question API:', error);
    return NextResponse.json(
      { error: 'Failed to get question' },
      { status: 500 }
    );
  }
} 