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
    const inventory: string[] = Array.isArray(body.inventory) ? body.inventory : []
    const adults = body.family?.adults || 2
    const children = body.family?.children_under_2 || 0

    const prompt = `
You are a premium family meal planner.

Create ${count} realistic, cookable recipes.

USER CONTEXT
- Adults: ${adults}
- Children under 2: ${children}
- I fancy: ${iFancy || "none given"}
- I have in: ${inventory.length ? inventory.join(", ") : "none given"}

RULES
- Respect the user's ingredients and craving closely.
- If the user gives paneer, use paneer.
- Do not introduce random unrelated proteins unless absolutely necessary.
- Use herbs, spices, sauces and pantry ingredients intelligently.
- Keep recipes family-friendly and genuinely cookable.
- Children under 2 should have lower salt, softer texture, and simple little-one guidance.

IMPORTANT
- "ingredients_used" must include EVERY ingredient the recipe uses, including oils, herbs, spices, sauces, seasoning, garnish, and staples used in the cooking.
- "missing_ingredients" must include ONLY ingredients that are NOT in the user's provided inventory.
- If an ingredient is not explicitly in the user's inventory, put it in missing_ingredients.
- Do not assume the user has salt, pepper, olive oil, garlic, lemon, or herbs unless they explicitly typed them.

RETURN ONLY VALID JSON.
No markdown. No commentary. No prose outside JSON.

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
      model: "gpt-4.1-mini",
      input: prompt,
    })

    const raw = response.output_text || ""

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      const firstBrace = raw.indexOf("{")
      const lastBrace = raw.lastIndexOf("}")
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1))
      } else {
        throw new Error("AI response was not valid JSON")
      }
    }

    if (!parsed?.recipes || !Array.isArray(parsed.recipes)) {
      throw new Error("AI response did not include recipes")
    }

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("GENERATE RECIPES ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to generate recipes",
      },
      { status: 500 }
    )
  }
}