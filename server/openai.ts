import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
// do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getTrainingSuggestions(
  recentLogs: any[],
  beltRank: string
): Promise<{
  focusAreas: string[];
  suggestedTechniques: string[];
  trainingTips: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a BJJ training assistant providing personalized advice."
        },
        {
          role: "user",
          content: `Based on these recent training logs: ${JSON.stringify(
            recentLogs
          )} and belt rank: ${beltRank}, provide training suggestions. Format response as JSON with focusAreas, suggestedTechniques, and trainingTips arrays.`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      focusAreas: ["Focus on fundamentals"],
      suggestedTechniques: ["Basic guard passes", "Submissions from mount"],
      trainingTips: ["Train consistently", "Stay hydrated"]
    };
  }
}
