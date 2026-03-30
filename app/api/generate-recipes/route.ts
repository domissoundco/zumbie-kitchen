import OpenAI from "openai"
import { NextResponse } from "next/server"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const count = Math.max(1, Math.min(Number(body.count) || 5, 10))
    const iFancy = body.i_fancy || ""
    const inventory: string[] = body.inventory || []
    const adults = body.family?.adults || 2
    const children = body.family?.children_under_2 || 0

    const prompt = `
You are a premium family meal planner.

Your job is to create ${count} HIGH-QUALITY, REALISTIC recipes.

USER CONTEXT:
- Adults: ${adults}
- Children under 2: ${children}

USER INPUT:
- I fancy: ${iFancy || "no specific preference"}
- Ingredients available: ${inventory.length ? inventory.join(", ") : "none specified"}

STRICT RULES:
- PRIORITISE using the provided ingredients
- DO NOT introduce random proteins (e.g. chicken) unless clearly appropriate
- If paneer is given → recipes MUST use paneer
- Meals must feel cohesive, not random combinations
- Include herbs, spices, oils, sauces naturally
- Think like a chef, not a random generator

FAMILY RULES:
- Adjust portion sizes for ${adults} adults
- Children under 2 must:
  - have low salt
  - soft textures
  - simple flavour adjustments
- Include "little_one_tips" for each recipe

RECIPE QUALITY:
- These should feel like £15 cookbook meals
- Balanced, realistic, cookable
- Not generic or boring

RETURN ONLY VALID JSON:

{
  "recipes": [
    {
      "title": "string",
      "summary": "short appealing description",
      "style": "e.g. Mediterranean, Comfort, Fresh",
      "prep_time_minutes": number,
      "cook_time_minutes": number,
      "ingredients_used": [
        { "name": "string", "amount": number, "unit": "string" }
      ],
      "missing_ingredients": [
        { "name": "string", "amount": number, "unit": "string" }
      ],
      "steps": ["step 1", "step 2"],
      "little_one_tips": ["tip 1", "tip 2"]
    }
  ]
}
`

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    })

    const text = response.output_text || ""

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      console.error("JSON parse error:", text)
      throw new Error("AI response was not valid JSON")
    }

    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error("API ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to generate recipes",
      },
      { status: 500 }
    )
  }
}