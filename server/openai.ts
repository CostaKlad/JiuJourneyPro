import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
// do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type TrainingLog = {
  type: string;
  duration: number;
  techniques: string[];
  date: Date;
};

type WizardRecommendation = {
  focusAreas: string[];
  suggestedTechniques: string[];
  trainingTips: string[];
  weeklyPlan: {
    day: string;
    focus: string;
    duration: number;
    techniques: string[];
  }[];
  strengthAreas: string[];
  improvementAreas: string[];
};

const DEFAULT_RECOMMENDATIONS: WizardRecommendation = {
  focusAreas: ["Fundamentals", "Position Control", "Submissions"],
  suggestedTechniques: ["Guard Passes", "Mount Control", "Basic Submissions"],
  trainingTips: ["Focus on consistency", "Practice with partners of varying skill levels"],
  weeklyPlan: [
    {
      day: "Monday",
      focus: "Guard Work",
      duration: 60,
      techniques: ["Guard Retention", "Sweeps"]
    },
    {
      day: "Wednesday",
      focus: "Passing & Control",
      duration: 60,
      techniques: ["Guard Passing", "Side Control"]
    },
    {
      day: "Friday",
      focus: "Submissions",
      duration: 60,
      techniques: ["Armbars", "Chokes"]
    }
  ],
  strengthAreas: ["Consistent Training", "Basic Techniques"],
  improvementAreas: ["Advanced Submissions", "Competition Preparation"]
};

export async function getTrainingSuggestions(
  recentLogs: TrainingLog[],
  beltRank: string,
  preferences?: {
    trainingFrequency: number;
    focusAreas: string[];
    goals: string[];
  }
): Promise<WizardRecommendation> {
  try {
    // Prepare the training history analysis
    const trainingHistory = recentLogs.map(log => ({
      type: log.type,
      duration: log.duration,
      techniqueCount: log.techniques.length,
      date: new Date(log.date).toISOString()
    }));

    // Create a detailed prompt for the AI
    const prompt = {
      trainingHistory,
      beltRank,
      preferences,
      request: "Analyze the training history and provide detailed BJJ training recommendations. Include specific techniques, training schedule, and areas of focus."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a BJJ training expert providing personalized recommendations based on training history and belt rank."
        },
        {
          role: "user",
          content: JSON.stringify(prompt)
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    // Parse and validate the response
    const recommendation = JSON.parse(response.choices[0].message.content);
    return {
      ...recommendation,
      weeklyPlan: recommendation.weeklyPlan || DEFAULT_RECOMMENDATIONS.weeklyPlan,
      strengthAreas: recommendation.strengthAreas || DEFAULT_RECOMMENDATIONS.strengthAreas,
      improvementAreas: recommendation.improvementAreas || DEFAULT_RECOMMENDATIONS.improvementAreas
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Return default recommendations if API fails
    return {
      ...DEFAULT_RECOMMENDATIONS,
      focusAreas: DEFAULT_RECOMMENDATIONS.focusAreas.map(area => 
        `${area} (${beltRank} Belt Level)`
      )
    };
  }
}