import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userInput, model, style, aspectRatio, quality, negativePrompt, mode, imageBase64, mimeType } = body

    if (!userInput || userInput.trim() === '') {
      return NextResponse.json({ error: 'Please provide a description.' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const systemPrompt = mode === 'transform' 
      ? `You are a Visual Prompt Engineer for image transformation. Analyze the image and create transformation instructions.`
      : `You are a Visual Prompt Engineer for image generation. Create professional prompts for static image generation.

Output Format:
## IMAGE COMPOSITION
[Composition description]

## VISUAL ELEMENTS
**Subject:** [Main subject]
**Environment:** [Setting]
**Props/Details:** [Additional elements]

## LIGHTING & ATMOSPHERE
**Light Source:** [Natural, artificial]
**Light Quality:** [Hard, soft]
**Mood:** [Atmosphere]

## STYLE SPECIFICATIONS
**Art Style:** [Style]
**Color Palette:** [Colors]
**Quality Tags:** [4K, detailed, etc.]

## FINAL IMAGE PROMPT
[Comprehensive prompt]`

    let userMessage = `Create an image prompt for:
**User Input:** ${userInput}
**Model:** ${model || 'default'}`
    if (style) userMessage += `\n**Style:** ${style}`
    if (aspectRatio) userMessage += `\n**Aspect Ratio:** ${aspectRatio}`
    if (quality) userMessage += `\n**Quality:** ${quality}`
    if (negativePrompt) userMessage += `\n**Avoid:** ${negativePrompt}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const generatedPrompt = completion.choices[0]?.message?.content

    if (!generatedPrompt) {
      return NextResponse.json({ error: 'Error generating prompt.' }, { status: 500 })
    }

    // Extract final prompt
    const finalPromptMatch = generatedPrompt.match(/## FINAL IMAGE PROMPT\n([\s\S]*?)(?=\n##|$)/)
    let finalPrompt = finalPromptMatch ? finalPromptMatch[1].trim() : userInput

    // Generate image
    let generatedImageUrl: string | null = null
    try {
      let imageSize: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440' = '1024x1024'
      switch (aspectRatio) {
        case '16:9': imageSize = '1344x768'; break
        case '9:16': imageSize = '768x1344'; break
        case '4:3': imageSize = '1152x864'; break
        case '3:4': imageSize = '864x1152'; break
        case '21:9': imageSize = '1440x720'; break
        default: imageSize = '1024x1024'
      }

      const imageResponse = await zai.images.generations.create({
        prompt: finalPrompt,
        size: imageSize
      })

      if (imageResponse.data && imageResponse.data[0]?.base64) {
        generatedImageUrl = `data:image/png;base64,${imageResponse.data[0].base64}`
      }
    } catch (imageError) {
      console.error('Image generation error:', imageError)
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      finalPrompt,
      imageUrl: generatedImageUrl,
      model: model || 'default',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in image API:', error)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ models: [{ id: 'default', name: 'Default' }] })
}
