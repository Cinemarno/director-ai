import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const SYSTEM_PROMPT = `You are a specialized AI collaborator acting as a Cinematic Prompt Engineer for DIRECTOR.AI. Transform raw user input into high-fidelity, professional-grade prompts for video generation models.

Output Format:
## Logical Reasoning & Analysis
[Step-by-step breakdown of creative decisions]

## FINAL VIDEO GENERATION PROMPT
**Subject:** ...
**Actions:** ...
**Camera Movement:** ...
**Sound and Audio effects:** ...
**Visual Tone:** ...`

const SYSTEM_PROMPT_MULTIPLAN = `You are a Cinematic Prompt Engineer for DIRECTOR.AI in MULTIPLAN MODE. Create professional prompts for EACH shot in the sequence.

For EACH plan, generate:
- Subject, Actions, Camera Movement, Sound, Visual Tone, Transition

Output Format:
## SEQUENCE OVERVIEW
[Brief description]

---

## 🎬 PLAN 1 — [Name]
**Duration:** [Duration]
**Subject:** ...
**Actions:** ...
**Camera Movement:** ...
**Sound and Audio effects:** ...
**Visual Tone:** ...
**Transition:** ...

---

[Continue for each plan...]`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userInput, model, multiplan, multiplanShots, styleVisuel, ambiance, cameraMovement, lighting, duration, format, resolution, fps, movementIntensity, depthOfField, audioDescription, additionalContext, colorPalette } = body

    if (!userInput || userInput.trim() === '') {
      return NextResponse.json({ error: 'Please provide a description.' }, { status: 400 })
    }

    const zai = await ZAI.create()
    const systemPrompt = multiplan ? SYSTEM_PROMPT_MULTIPLAN : SYSTEM_PROMPT

    let userMessage = `Generate a professional video generation prompt for:
**Video Model:** ${model}
**User Input:** ${userInput}`

    if (multiplan && multiplanShots && multiplanShots.length > 0) {
      userMessage += `\n\n**MULTIPLAN SEQUENCE — ${multiplanShots.length} PLANS:**`
      multiplanShots.forEach((shot: {duration: string, description: string}, index: number) => {
        userMessage += `\n\n### PLAN ${index + 1}`
        userMessage += `\n- **Duration:** ${shot.duration}`
        userMessage += `\n- **Description:** ${shot.description || 'Develop this shot'}`
      })
    }

    if (styleVisuel && styleVisuel.length > 0) userMessage += `\n\n**Visual Style:** ${styleVisuel.join(', ')}`
    if (ambiance && ambiance.length > 0) userMessage += `\n**Mood & Ambiance:** ${ambiance.join(', ')}`
    if (cameraMovement && cameraMovement.length > 0) userMessage += `\n**Camera Work:** ${cameraMovement.join(', ')}`
    if (lighting && lighting.length > 0) userMessage += `\n**Lighting:** ${lighting.join(', ')}`
    if (colorPalette && colorPalette.length > 0) userMessage += `\n**Color Palette:** ${colorPalette.join(', ')}`
    
    if (duration) {
      userMessage += `\n\n**Technical Parameters:**`
      userMessage += `\n- Duration: ${duration}`
      if (format) userMessage += `\n- Format: ${format}`
      if (resolution) userMessage += `\n- Resolution: ${resolution}`
      if (fps) userMessage += `\n- Frame Rate: ${fps}`
      if (movementIntensity !== undefined) userMessage += `\n- Movement Intensity: ${movementIntensity}/10`
      if (depthOfField !== undefined) userMessage += `\n- Depth of Field: ${depthOfField}/10`
    }

    if (audioDescription) userMessage += `\n\n**Audio Description:** ${audioDescription}`
    if (additionalContext) userMessage += `\n\n**Additional Context:** ${additionalContext}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    const generatedPrompt = completion.choices[0]?.message?.content

    if (!generatedPrompt) {
      return NextResponse.json({ error: 'Error generating prompt.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      model,
      multiplan: multiplan || false,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating prompt:', error)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
