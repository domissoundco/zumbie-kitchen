import { NextRequest, NextResponse } from "next/server";

export interface RecipeIngredient { name: string; quantity: string; unit: string; }

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cookTime: string;
  prepTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: RecipeIngredient[];
  steps: string[];
  childNotes: string[];   // one entry per step; empty string = no note for that step
  seasoningSuggestions: string[];
  tags: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
}

export interface GenerateRecipesResponse {
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[generate-recipes] OPENAI_API_KEY not set");
    return NextResponse.json({ error: "OpenAI API key not configured on the server." }, { status: 500 });
  }

  let body: {
    mode: "suggest" | "fancy" | "make";
    input?: string;
    count?: number;
    adults?: number;
    childrenUnder2?: number;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const { mode, input, count = 3, adults = 2, childrenUnder2 = 0 } = body;
  const hasKids = childrenUnder2 > 0;
  const totalServings = adults + Math.ceil(childrenUnder2 * 0.3);

  const servingsNote = hasKids
    ? `${adults} adult${adults !== 1 ? "s" : ""} and ${childrenUnder2} child${childrenUnder2 > 1 ? "ren" : ""} under 2 (scale ingredients for ${totalServings} effective portions)`
    : `${adults} adult${adults !== 1 ? "s" : ""}`;

  const childStepInstruction = hasKids ? `
IMPORTANT — children under 2 are eating too. For each step in the method, you MUST populate the childNotes array with a parallel note at the same index. Where relevant, the note should say things like:
- "Set aside [child portion] before adding [spice/salt/chilli/honey]. Continue cooking child portion separately until done."
- "Remove [X] for the little ones before adding [ingredient]."
- "Serve child portion plain / mashed / in smaller pieces suitable for under 2s."
- Or if the step has no child-specific action, use an empty string "" for that index.
The childNotes array must have EXACTLY the same number of elements as the steps array.
Avoid honey, excess salt, whole nuts, added sugar, strong spices, and choking hazards in any child portions.
` : `For childNotes, return an array of empty strings ("") with the same length as steps — one per step.`;

  const modePrompts: Record<string, string> = {
    suggest: `Generate exactly ${count} diverse, delicious meal-prep recipes varied in cuisine, protein source, and cooking method.`,
    fancy: `Generate exactly 3 recipes based on this craving: "${input}". Satisfy it in 3 distinct ways.`,
    make: `Generate exactly 3 recipes that use "${input}" as a key ingredient, each in a different way.`,
  };

  const systemPrompt = `You are a warm, expert home cooking assistant for Zumbie Kitchen.
Return ONLY valid JSON — no markdown fences, no preamble, no trailing text.
Adjust all quantities for: ${servingsNote}.`;

  const userPrompt = `${modePrompts[mode]}

${childStepInstruction}

Return this exact JSON shape (no deviations):
{
  "recipes": [
    {
      "id": "kebab-slug",
      "title": "Recipe Name",
      "description": "Two engaging sentences about the dish.",
      "cookTime": "25 mins",
      "prepTime": "10 mins",
      "servings": ${totalServings},
      "difficulty": "Easy",
      "ingredients": [
        { "name": "olive oil", "quantity": "2", "unit": "tbsp" }
      ],
      "steps": [
        "Step one instruction.",
        "Step two instruction."
      ],
      "childNotes": [
        "Set aside a small portion before adding chilli flakes.",
        ""
      ],
      "seasoningSuggestions": [
        "A squeeze of lemon brightens the whole dish.",
        "Try smoked paprika for extra depth."
      ],
      "tags": ["quick", "vegetarian", "family-friendly"]
    }
  ],
  "shoppingList": [
    {
      "id": "olive-oil",
      "name": "olive oil",
      "quantity": "2",
      "unit": "tbsp",
      "category": "Pantry"
    }
  ]
}

Rules:
- shoppingList consolidates ALL ingredients across ALL recipes, merging duplicates with combined quantities.
- Valid categories: Produce, Meat & Fish, Dairy, Pantry, Spices, Frozen, Bakery, Other.
- childNotes must have the SAME number of elements as steps in every recipe.`;

  let openAIResponse: Response;
  try {
    openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 4500,
        response_format: { type: "json_object" },
      }),
    });
  } catch (networkErr) {
    console.error("[generate-recipes] Network error:", networkErr);
    return NextResponse.json({ error: "Could not reach OpenAI. Check server network access." }, { status: 502 });
  }

  if (!openAIResponse.ok) {
    const errText = await openAIResponse.text();
    console.error(`[generate-recipes] OpenAI ${openAIResponse.status}:`, errText);
    return NextResponse.json(
      { error: `OpenAI error ${openAIResponse.status}. Check your API key, quota, and billing.`, detail: errText },
      { status: 502 }
    );
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try { data = await openAIResponse.json(); }
  catch { return NextResponse.json({ error: "Failed to parse OpenAI response." }, { status: 500 }); }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[generate-recipes] Empty content:", data);
    return NextResponse.json({ error: "OpenAI returned no content." }, { status: 500 });
  }

  let parsed: GenerateRecipesResponse;
  try { parsed = JSON.parse(content); }
  catch {
    console.error("[generate-recipes] JSON parse failed:", content);
    return NextResponse.json({ error: "Could not parse recipe JSON from OpenAI." }, { status: 500 });
  }

  // Sanitise and ensure IDs + childNotes alignment
  const normaliseDifficulty = (d: string): "Easy" | "Medium" | "Hard" => {
    const key = (d || "").charAt(0).toUpperCase() + (d || "").slice(1).toLowerCase();
    if (key === "Easy" || key === "Medium" || key === "Hard") return key;
    return "Medium";
  };

  parsed.recipes = (parsed.recipes || []).map((r, i) => ({
    ...r,
    id: r.id || `recipe-${Date.now()}-${i}`,
    difficulty: normaliseDifficulty(r.difficulty),
    childNotes: Array.isArray(r.childNotes) && r.childNotes.length === r.steps.length
      ? r.childNotes
      : r.steps.map(() => ""),
  }));

  parsed.shoppingList = (parsed.shoppingList || []).map((s, i) => ({
    ...s,
    id: s.id || `item-${Date.now()}-${i}`,
  }));

  return NextResponse.json(parsed);
}
