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

type PeerRecommendation = {
  userId: number;
  matchScore: number;
  reasons: string[];
  suggestedActivities: string[];
  complementarySkills: string[];
  learningOpportunities: string[];
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

export async function getPeerRecommendations(
  userId: number,
  userProfile: {
    beltRank: string;
    techniques: string[];
    goals: string[];
    trainingFrequency: number;
    gym?: string;
  },
  potentialPartners: Array<{
    id: number;
    beltRank: string;
    techniques: string[];
    goals: string[];
    trainingFrequency: number;
    gym?: string;
  }>,
  recentLogs?: TrainingLog[]
): Promise<PeerRecommendation[]> {
  try {
    // Prepare the analysis context
    const context = {
      user: {
        ...userProfile,
        recentTraining: recentLogs?.map(log => ({
          type: log.type,
          techniques: log.techniques,
          date: new Date(log.date).toISOString()
        }))
      },
      potentialPartners: potentialPartners.map(partner => ({
        id: partner.id,
        beltRank: partner.beltRank,
        techniques: partner.techniques,
        goals: partner.goals,
        trainingFrequency: partner.trainingFrequency,
        gym: partner.gym
      }))
    };

    // Create a detailed prompt for the AI
    const prompt = {
      context,
      request: "Analyze the user profile and potential training partners to provide detailed peer recommendations. Consider belt rank compatibility, shared and complementary techniques, goals alignment, and training frequency. Provide specific reasons for each match and suggest collaborative training activities."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a BJJ training partner matching expert. Consider belt rank progression, technique compatibility, and training goals when making recommendations."
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
    const recommendations = JSON.parse(response.choices[0].message.content);
    return recommendations.matches.map((match: any) => ({
      userId: match.partnerId,
      matchScore: match.compatibilityScore,
      reasons: match.matchReasons,
      suggestedActivities: match.recommendedActivities,
      complementarySkills: match.complementaryTechniques,
      learningOpportunities: match.mutualGrowthAreas
    }));
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Return basic recommendations if API fails
    return potentialPartners.slice(0, 3).map(partner => ({
      userId: partner.id,
      matchScore: 0.7,
      reasons: ["Similar belt rank", "Shared training goals"],
      suggestedActivities: ["Drill basic techniques", "Practice specific positions"],
      complementarySkills: ["Guard passing", "Submissions"],
      learningOpportunities: ["Technique refinement", "Position control"]
    }));
  }
}

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
      techniques: log.techniques,
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