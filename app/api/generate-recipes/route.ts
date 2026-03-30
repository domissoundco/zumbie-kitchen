import OpenAI from "openai"
import { NextResponse } from "next/server"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const inventory = Array.isArray(body.inventory) ? body.inventory : []
    const count = Math.max(1, Math.min(Number(body.count) || 5, 10))
    const fancy = body.i_fancy || "something tasty and family-friendly"

    const prompt = `
You are a premium family meal planner.

Create ${count} recipe ideas.

The user says:
- I fancy: ${fancy}
- We already have: ${inventory.join(", ") || "nothing specified"}

Requirements:
- Use the ingredients they already have where possible
- Add herbs, spices, sauces and pantry items intelligently
- Avoid random unrelated proteins unless clearly helpful
- Keep meals realistic for a family week
- Suitable for mum, dad and a little one
- Keep flavours interesting but not overly spicy
- Return recipes that feel cohesive and actually cookable

Return valid JSON only in this shape:
{
  "recipes": [
    {
      "title": "string",
      "summary": "string",
      "style": "string",
      "prep_time_minutes": 10,
      "cook_time_minutes": 20,
      "ingredients_used": [
        { "name": "string", "amount": 1, "unit": "string" }
      ],
      "missing_ingredients": [
        { "name": "string", "amount": 1, "unit": "string" }
      ],
      "steps": ["string"],
      "little_one_tips": ["string"]
    }
  ]
}
`

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    })

    const text = response.output_text || ""
    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("GENERATE RECIPES ERROR:", error)
    return NextResponse.json(
      {
        message: error?.message || "Failed to generate recipes",
      },
      { status: 500 }
    )
  }
}