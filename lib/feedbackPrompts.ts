/**
 * Pedagogical feedback prompts and rubric definitions
 * These guide teachers to give more effective, focused feedback
 */

export type FeedbackPrompt = {
  id: string
  question: string
  hint?: string
  examples?: string[]
}

export type RubricCategory = {
  id: string
  name: string
  description: string
  levels: {
    score: number
    label: string
    description: string
  }[]
}

// Prompts for each feedback field
export const FEEDBACK_PROMPTS: Record<string, FeedbackPrompt[]> = {
  summaryFeedback: [
    {
      id: 'one_thing',
      question: "What's the ONE thing this essay needs most?",
      hint: "Focus on the single most impactful improvement - don't overwhelm with everything.",
      examples: [
        "This essay needs a stronger hook that draws readers in immediately.",
        "The central theme gets lost in the middle - anchor every paragraph to your main message.",
      ],
    },
    {
      id: 'reader_impact',
      question: "After reading, what will the admissions officer remember?",
      hint: "If nothing stands out, that's the problem to address.",
    },
    {
      id: 'unique_value',
      question: "What does this essay reveal that no other application component shows?",
      hint: "Essays should add new dimensions, not repeat resume items.",
    },
  ],
  strengths: [
    {
      id: 'voice_shine',
      question: "Where does their voice shine through most?",
      hint: "Point to specific sentences or paragraphs where their personality comes alive.",
      examples: [
        "Your humor in paragraph 2 ('I realized my soufflé had become a metaphor for my life') shows real personality.",
        "The way you describe your grandmother's hands tells us so much about your relationship.",
      ],
    },
    {
      id: 'memorable_moment',
      question: "What moment or detail made you pause?",
      hint: "Identify the 'sticky' content they should build on.",
    },
    {
      id: 'authenticity',
      question: "Where do you believe them most?",
      hint: "Real vulnerability and specificity create trust with readers.",
    },
  ],
  priorityRevisions: [
    {
      id: 'cut_expand',
      question: "What should they cut vs. what should they expand?",
      hint: "Be specific: 'Cut paragraphs 3-4, expand the moment on the bus.'",
      examples: [
        "CUT: The background info in paragraph 1 - we don't need the history of your school's debate team.",
        "EXPAND: The conversation with your dad. Right now it's two sentences - this deserves a full paragraph.",
      ],
    },
    {
      id: 'show_dont_tell',
      question: "Where are they telling instead of showing?",
      hint: "Flag abstract claims that need concrete evidence.",
      examples: [
        "'I'm passionate about helping others' - show us a specific moment when you helped someone.",
        "'This experience changed me' - describe what you do differently now.",
      ],
    },
    {
      id: 'prompt_alignment',
      question: "How well does this answer the actual prompt?",
      hint: "Students often write great essays that don't address the question asked.",
    },
  ],
  overallGuidance: [
    {
      id: 'next_draft',
      question: "What should the next draft focus on?",
      hint: "Give them a clear direction, not a laundry list.",
      examples: [
        "For your next draft, focus ONLY on the opening. Try three different hooks and see which one grabs attention.",
        "Next draft: Remove every sentence that could be written by another student. Keep only what's uniquely yours.",
      ],
    },
    {
      id: 'word_count',
      question: "Are they using their word count effectively?",
      hint: "Flag if they're rushing the ending or padding the middle.",
    },
    {
      id: 'reader_questions',
      question: "What questions does a reader have after finishing?",
      hint: "Unanswered questions often point to gaps in the narrative.",
    },
  ],
}

// Rubric for structured assessment
export const ESSAY_RUBRIC: RubricCategory[] = [
  {
    id: 'authenticity',
    name: 'Authenticity & Voice',
    description: 'Does the essay sound like a real person with a unique perspective?',
    levels: [
      { score: 1, label: 'Generic', description: 'Could be written by anyone; no personal voice' },
      { score: 2, label: 'Emerging', description: 'Occasional glimpses of personality' },
      { score: 3, label: 'Present', description: 'Clear voice, but some generic sections' },
      { score: 4, label: 'Strong', description: 'Consistent voice with memorable moments' },
      { score: 5, label: 'Exceptional', description: 'Unmistakably unique; impossible to forget' },
    ],
  },
  {
    id: 'structure',
    name: 'Narrative Structure',
    description: 'Does the essay have a clear arc with purposeful organization?',
    levels: [
      { score: 1, label: 'Disorganized', description: 'No clear structure; hard to follow' },
      { score: 2, label: 'Basic', description: 'Has beginning/middle/end but feels flat' },
      { score: 3, label: 'Functional', description: 'Logical flow but predictable' },
      { score: 4, label: 'Engaging', description: 'Clear arc with good pacing' },
      { score: 5, label: 'Masterful', description: 'Structure enhances meaning; every part essential' },
    ],
  },
  {
    id: 'clarity',
    name: 'Clarity & Concision',
    description: 'Is every word earning its place? Is meaning clear?',
    levels: [
      { score: 1, label: 'Confusing', description: 'Unclear meaning; wordy and unfocused' },
      { score: 2, label: 'Needs Work', description: 'Main points buried in fluff' },
      { score: 3, label: 'Adequate', description: 'Generally clear with some wordiness' },
      { score: 4, label: 'Polished', description: 'Clear and efficient; few wasted words' },
      { score: 5, label: 'Precise', description: 'Every word intentional; crystalline clarity' },
    ],
  },
  {
    id: 'promptResponse',
    name: 'Prompt Response',
    description: 'Does the essay directly and fully address what was asked?',
    levels: [
      { score: 1, label: 'Off-Topic', description: 'Doesn\'t answer the prompt' },
      { score: 2, label: 'Tangential', description: 'Loosely related but misses the point' },
      { score: 3, label: 'Partial', description: 'Addresses prompt but incompletely' },
      { score: 4, label: 'Complete', description: 'Fully addresses all parts of prompt' },
      { score: 5, label: 'Insightful', description: 'Goes beyond prompt; adds unexpected depth' },
    ],
  },
]

// Quick feedback phrases for common situations
export const QUICK_FEEDBACK = {
  positive: [
    { label: 'Strong hook', text: 'Your opening immediately draws readers in.' },
    { label: 'Specific details', text: 'The concrete details here bring this moment to life.' },
    { label: 'Authentic voice', text: 'This section sounds genuinely like you - keep this tone throughout.' },
    { label: 'Good reflection', text: 'You do a great job connecting this experience to personal growth.' },
    { label: 'Clear structure', text: 'The organization here makes your argument easy to follow.' },
  ],
  constructive: [
    { label: 'Show don\'t tell', text: 'Instead of telling us how you felt, show us through actions and details.' },
    { label: 'Be specific', text: 'Replace this general statement with a concrete example or moment.' },
    { label: 'Cut this', text: 'This section doesn\'t add to your main message - consider removing it.' },
    { label: 'Expand here', text: 'This is your strongest moment - it deserves more development.' },
    { label: 'Prompt check', text: 'Make sure this connects back to what the prompt is asking.' },
    { label: 'Cliche alert', text: 'This phrase is overused in college essays - find a more original way to express this.' },
  ],
}

// Helper to get random prompts for a field
export function getRandomPrompts(field: string, count: number = 2): FeedbackPrompt[] {
  const prompts = FEEDBACK_PROMPTS[field] || []
  const shuffled = [...prompts].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// Helper to get rubric level description
export function getRubricDescription(categoryId: string, score: number): string | null {
  const category = ESSAY_RUBRIC.find(c => c.id === categoryId)
  if (!category) return null
  const level = category.levels.find(l => l.score === score)
  return level ? level.description : null
}
