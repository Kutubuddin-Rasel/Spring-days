import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { wishes } = await request.json();

    const w1 = wishes[0]?.trim() || 'a secret wish';
    const w2 = wishes[1]?.trim() || 'a secret wish';
    const w3 = wishes[2]?.trim() || 'a secret wish';

    const apiKey = process.env.GEMINI_API_KEY!;
    // Using gemini-1.5-flash as it is fast, free-tier eligible, and great for this task
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are a thoughtful, warm presence granting three wishes. For each wish, craft ONE deeply personal sentence (10–15 words). 

CRITICAL INSTRUCTION: You must match the tone and weight of the wish. 
- If the wish is casual, simple, or fun (e.g., watching a movie, taking a walk), respond with warm, grounded, and natural language. Do NOT use overly dramatic, ancient, or flowery poetry for everyday activities.
- If the wish is deep, abstract, or emotional, respond with a more poetic, resonant blessing.

Wish 1: "${w1}"
Wish 2: "${w2}"
Wish 3: "${w3}"

Respond ONLY with a JSON array of exactly 3 strings. No markdown, no preamble, no explanation:
["response for wish 1","response for wish 2","response for wish 3"]`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
         // maxOutputTokens: 350,
          // This forces Gemini to strictly return valid JSON
          responseMimeType: "application/json", 
        }
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("🚨 Gemini API Error Status:", response.status);
      console.error("🚨 Gemini API Error Details:", JSON.stringify(data, null, 2));
    } else {
      console.log("✅ Gemini Raw Success Data:", JSON.stringify(data, null, 2));
    }
    // Extract the text from Gemini's response structure
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let responses: string[];
    try {
      // Clean up in case the model adds markdown formatting
      const cleaned = raw.replace(/```json|```/g, '').trim();
      responses = JSON.parse(cleaned);
      if (!Array.isArray(responses) || responses.length !== 3) throw new Error('bad shape');
    } catch {
      // Fallback if parsing fails
      responses = [
        'The universe leans close — it was already waiting for you.',
        'So let it be written in light, in bloom, in every season.',
        'Sealed in starlight and carried on every blossom — granted.',
      ];
    }

    return NextResponse.json({ responses });
  } catch {
    // Fallback if the network request fails entirely
    return NextResponse.json({
      responses: [
        'The universe leans close — it was already waiting for you.',
        'So let it be written in light, in bloom, in every season.',
        'Sealed in starlight and carried on every blossom — granted.',
      ],
    });
  }
}