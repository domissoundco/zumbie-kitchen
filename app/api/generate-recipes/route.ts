import OpenAI from "openai"
import { NextResponse } from "next/server"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const prompt = `
You are a practical family meal planner.

Create ${body.count ?? 3} meal ideas.

Use these ingredients first where possible:
Proteins: ${(body.proteins ?? []).join(", ")}
Veg: ${(body.veg ?? []).join(", ")}
Herbs and spices: ${(body.herbs ?? []).join(", ")}
Cupboard: ${(body.cupboard ?? []).join(", ")}
Fridge: ${(body.fridge ?? []).join(", ")}

Family:
Mum portions: ${body.family?.mum ?? 1}
Dad portions: ${body.family?.dad ?? 1}
Son portions: ${body.family?.son ?? 1}

What the user fancies:
${body.i_fancy ?? "anything tasty"}

Rules:
- little-one friendly
- low spice unless clearly requested
- practical midweek cooking
- include flavour, not just protein + veg
- use herbs, spices, sauces and pantry staples when useful

Return a short numbered list only.
For each meal include:
- title
- one-line summary
- key flavours
- missing ingredients if any
`

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    })

    return NextResponse.json({
      ok: true,
      text: response.output_text,
    })
  } catch (error: any) {
    console.error("GENERATE RECIPES ERROR:", error)
    return NextResponse.json(
      {
        ok: false,
        message: error?.message ?? "Unknown error",
      },
      { status: 500 }
    )
  }
}