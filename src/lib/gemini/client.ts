import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export function getGeminiModel(modelName = 'gemini-1.5-flash') {
  return genAI.getGenerativeModel({ model: modelName })
}

export function getGeminiModelWithSearch() {
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    // Note: googleSearch grounding may require specific API version
    tools: [{ googleSearch: {} } as any],
  })
}

export { genAI }
