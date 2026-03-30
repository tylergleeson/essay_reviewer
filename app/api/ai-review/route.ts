import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert college admissions essay coach. You review student essays and provide detailed, constructive feedback. You are encouraging but honest, and you focus on helping students tell their authentic story effectively.

Always respond with valid JSON in this exact format:
{
  "summaryFeedback": "A 2-3 paragraph overall assessment of the essay",
  "strengths": "What the essay does well — be specific with examples from the text",
  "priorityRevisions": "The top 3 most important things to fix, numbered and specific",
  "overallGuidance": "Strategic advice for the next draft — big picture direction",
  "rubricScores": {
    "clarity": <1-10>,
    "structure": <1-10>,
    "voice": <1-10>,
    "impact": <1-10>
  }
}

Score guidelines:
- 1-3: Needs significant work
- 4-5: Below average, key issues to address
- 6-7: Good foundation, room for improvement
- 8-9: Strong essay, minor refinements needed
- 10: Exceptional, publishable quality`

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { essayId } = body

    if (!essayId) {
      return NextResponse.json(
        { error: 'Essay ID is required' },
        { status: 400 }
      )
    }

    // Fetch essay with latest draft
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        drafts: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        application: true,
      },
    })

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 })
    }

    // Verify ownership
    if (essay.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (essay.drafts.length === 0) {
      return NextResponse.json(
        { error: 'Essay has no drafts to review' },
        { status: 400 }
      )
    }

    const latestDraft = essay.drafts[0]

    // Build the user prompt
    const userPrompt = `Please review this college admissions essay and provide detailed feedback.

${essay.prompt ? `Essay prompt: ${essay.prompt}\n` : ''}${essay.title ? `Essay title: ${essay.title}\n` : ''}Word count: ${latestDraft.wordCount}

---

${latestDraft.content}

---

Provide your feedback as JSON.`

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    })

    // Parse the response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    let feedback
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      feedback = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Save feedback to database
    const savedFeedback = await prisma.feedback.create({
      data: {
        essayId,
        coachId: session.user.id, // self-review
        draftVersionReviewed: latestDraft.versionNumber,
        summaryFeedback: feedback.summaryFeedback,
        strengths: feedback.strengths,
        priorityRevisions: feedback.priorityRevisions,
        overallGuidance: feedback.overallGuidance,
        rubricScores: JSON.stringify(feedback.rubricScores),
        isAI: true,
      },
    })

    return NextResponse.json(savedFeedback, { status: 201 })
  } catch (error) {
    console.error('Error creating AI review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
