import { NextRequest, NextResponse } from 'next/server'
import ZAI, { VisionMessage } from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64, mimeType, customInstructions, targetModel } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'Please provide an image.' }, { status: 400 })
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validMimeTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'Unsupported image format.' }, { status: 400 })
    }

    const zai = await ZAI.create()

    let userPrompt = `Analyze this image and generate a professional video generation prompt.

Output Format:
## IMAGE ANALYSIS
[Detailed breakdown of what you see]

## CINEMATIC INTERPRETATION
[How this image could extend into video]

## SUGGESTED VIDEO PROMPT
**Subject:** [Description]
**Actions:** [Suggested movements]
**Camera Movement:** [Professional camera work]
**Sound and Audio effects:** [Ambient sounds, music]
**Visual Tone:** [Lighting style, aesthetic]

## STYLE SUGGESTIONS
- **Visual Style:** [Cinematic 4K, Film Noir, etc.]
- **Mood:** [Melancholic, Epic, etc.]
- **Lighting:** [Golden hour, Neon, etc.]
- **Camera:** [Tracking shot, Dolly in, etc.]`

    if (targetModel) userPrompt += `\n\n**Target Video Model:** ${targetModel}`
    if (customInstructions) userPrompt += `\n\n**Custom Instructions:** ${customInstructions}`

    const imageUrl = `data:${mimeType};base64,${imageBase64}`

    const messages: VisionMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ]

    const response = await zai.chat.completions.createVision({
      model: 'glm-4.6v',
      messages,
      thinking: { type: 'disabled' }
    })

    const analysis = response.choices?.[0]?.message?.content

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis returned no result.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error analyzing image:', error)
    return NextResponse.json({ error: 'An error occurred during analysis.' }, { status: 500 })
  }
}
