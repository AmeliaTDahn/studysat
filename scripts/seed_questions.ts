const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  text: string;
  options: { answer: string; explanation: string }[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

const algebraQuestions: Question[] = [
  {
    text: "Solve for x: 2x + 5 = 15",
    options: [
      { answer: "x = 5", explanation: "Subtract 5 from both sides, then divide by 2" },
      { answer: "x = 10", explanation: "This is incorrect" },
      { answer: "x = 3", explanation: "This is incorrect" },
      { answer: "x = 7", explanation: "This is incorrect" }
    ],
    correct_answer: "x = 5",
    explanation: "To solve for x, first subtract 5 from both sides: 2x = 10, then divide both sides by 2: x = 5",
    difficulty: "easy",
    topic: "Algebra"
  },
  {
    text: "Solve the equation: 3(x - 4) = 21",
    options: [
      { answer: "x = 11", explanation: "Distribute 3, then add 12 to both sides" },
      { answer: "x = 9", explanation: "This is incorrect" },
      { answer: "x = 7", explanation: "This is incorrect" },
      { answer: "x = 13", explanation: "This is incorrect" }
    ],
    correct_answer: "x = 11",
    explanation: "First distribute 3: 3x - 12 = 21, then add 12 to both sides: 3x = 33, finally divide by 3: x = 11",
    difficulty: "medium",
    topic: "Algebra"
  },
  {
    text: "Factor the expression: x² + 7x + 12",
    options: [
      { answer: "(x + 3)(x + 4)", explanation: "Find factors of 12 that add to 7" },
      { answer: "(x + 6)(x + 1)", explanation: "This is incorrect" },
      { answer: "(x + 2)(x + 5)", explanation: "This is incorrect" },
      { answer: "(x + 8)(x - 1)", explanation: "This is incorrect" }
    ],
    correct_answer: "(x + 3)(x + 4)",
    explanation: "Look for factors of 12 (last term) that add up to 7 (coefficient of x). 3 and 4 work because 3 × 4 = 12 and 3 + 4 = 7",
    difficulty: "hard",
    topic: "Algebra"
  }
];

const geometryQuestions: Question[] = [
  {
    text: "What is the area of a circle with radius 4 units?",
    options: [
      { answer: "16π square units", explanation: "Use the formula A = πr²" },
      { answer: "8π square units", explanation: "This is incorrect" },
      { answer: "4π square units", explanation: "This is incorrect" },
      { answer: "12π square units", explanation: "This is incorrect" }
    ],
    correct_answer: "16π square units",
    explanation: "The area of a circle is given by A = πr². With r = 4, we get A = π(4)² = 16π square units",
    difficulty: "easy",
    topic: "Geometry"
  },
  {
    text: "In a right triangle, if one angle is 30° and the hypotenuse is 10 units, what is the length of the shortest side?",
    options: [
      { answer: "5 units", explanation: "Use the 30-60-90 triangle ratios" },
      { answer: "10 units", explanation: "This is incorrect" },
      { answer: "8.66 units", explanation: "This is incorrect" },
      { answer: "7.5 units", explanation: "This is incorrect" }
    ],
    correct_answer: "5 units",
    explanation: "In a 30-60-90 triangle, the shortest side (opposite to 30°) is half the length of the hypotenuse. Since the hypotenuse is 10 units, the shortest side is 5 units",
    difficulty: "medium",
    topic: "Geometry"
  },
  {
    text: "What is the volume of a cylinder with radius 3 units and height 8 units?",
    options: [
      { answer: "72π cubic units", explanation: "Use the formula V = πr²h" },
      { answer: "48π cubic units", explanation: "This is incorrect" },
      { answer: "24π cubic units", explanation: "This is incorrect" },
      { answer: "96π cubic units", explanation: "This is incorrect" }
    ],
    correct_answer: "72π cubic units",
    explanation: "The volume of a cylinder is V = πr²h. With r = 3 and h = 8, we get V = π(3)²(8) = 72π cubic units",
    difficulty: "hard",
    topic: "Geometry"
  }
];

const advancedMathQuestions: Question[] = [
  {
    text: "What is the derivative of f(x) = x³ - 4x² + 2x - 1?",
    options: [
      { answer: "3x² - 8x + 2", explanation: "Use power rule and combine like terms" },
      { answer: "x³ - 4x + 2", explanation: "This is incorrect" },
      { answer: "3x² - 4x + 2", explanation: "This is incorrect" },
      { answer: "3x² - 8x - 1", explanation: "This is incorrect" }
    ],
    correct_answer: "3x² - 8x + 2",
    explanation: "Using the power rule: derivative of x³ is 3x², of -4x² is -8x, of 2x is 2, and the derivative of -1 is 0",
    difficulty: "medium",
    topic: "Advanced Mathematics"
  },
  {
    text: "Solve the complex equation: z² + 4z + 13 = 0",
    options: [
      { answer: "z = -2 ± 3i", explanation: "Complete the square and solve" },
      { answer: "z = 2 ± 3i", explanation: "This is incorrect" },
      { answer: "z = -2 ± 2i", explanation: "This is incorrect" },
      { answer: "z = 2 ± 2i", explanation: "This is incorrect" }
    ],
    correct_answer: "z = -2 ± 3i",
    explanation: "Complete the square: z² + 4z + 13 = (z² + 4z + 4) + 9 = (z + 2)² + 9. Therefore z + 2 = ±3i, so z = -2 ± 3i",
    difficulty: "hard",
    topic: "Advanced Mathematics"
  },
  {
    text: "What is the limit as x approaches infinity of (x² + 3x)/(2x² - 1)?",
    options: [
      { answer: "1/2", explanation: "Divide numerator and denominator by highest power of x" },
      { answer: "0", explanation: "This is incorrect" },
      { answer: "1", explanation: "This is incorrect" },
      { answer: "∞", explanation: "This is incorrect" }
    ],
    correct_answer: "1/2",
    explanation: "Divide both numerator and denominator by x². In numerator: 1 + 3/x, in denominator: 2 - 1/x². As x→∞, this approaches 1/2",
    difficulty: "hard",
    topic: "Advanced Mathematics"
  }
];

const dataAnalysisQuestions: Question[] = [
  {
    text: "The mean of 5 numbers is 10. If one number is removed, the mean of the remaining numbers is 9. What number was removed?",
    options: [
      { answer: "14", explanation: "Use the mean formula and solve algebraically" },
      { answer: "12", explanation: "This is incorrect" },
      { answer: "15", explanation: "This is incorrect" },
      { answer: "13", explanation: "This is incorrect" }
    ],
    correct_answer: "14",
    explanation: "Original sum = 50 (5 × 10). New sum = 36 (4 × 9). The removed number is 50 - 36 = 14",
    difficulty: "medium",
    topic: "Data Analysis"
  },
  {
    text: "In a normal distribution, what percentage of data falls within one standard deviation of the mean?",
    options: [
      { answer: "68%", explanation: "This is the empirical rule for normal distributions" },
      { answer: "95%", explanation: "This is incorrect" },
      { answer: "99.7%", explanation: "This is incorrect" },
      { answer: "50%", explanation: "This is incorrect" }
    ],
    correct_answer: "68%",
    explanation: "According to the empirical rule (68-95-99.7 rule), approximately 68% of the data falls within one standard deviation of the mean in a normal distribution",
    difficulty: "easy",
    topic: "Data Analysis"
  },
  {
    text: "If the probability of event A is 0.3 and the probability of event B is 0.4, and the events are independent, what is the probability of both events occurring?",
    options: [
      { answer: "0.12", explanation: "Multiply the probabilities for independent events" },
      { answer: "0.7", explanation: "This is incorrect" },
      { answer: "0.1", explanation: "This is incorrect" },
      { answer: "0.28", explanation: "This is incorrect" }
    ],
    correct_answer: "0.12",
    explanation: "For independent events, P(A and B) = P(A) × P(B) = 0.3 × 0.4 = 0.12",
    difficulty: "medium",
    topic: "Data Analysis"
  }
];

async function seedQuestions() {
  const allQuestions = [
    ...algebraQuestions,
    ...geometryQuestions,
    ...advancedMathQuestions,
    ...dataAnalysisQuestions
  ];

  for (const question of allQuestions) {
    const { error } = await supabase
      .from('questions')
      .insert([question]);

    if (error) {
      console.error('Error inserting question:', question.text, error);
    } else {
      console.log('Successfully inserted question:', question.text);
    }
  }
}

seedQuestions()
  .catch(console.error)
  .finally(() => {
    console.log('Seeding complete');
    process.exit(0);
  }); 