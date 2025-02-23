import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Star,
  Target,
  Clock,
  Dumbbell,
  Brain,
} from "lucide-react";
import { AchievementCategory } from "@shared/schema";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: keyof typeof AchievementCategory;
  progressMax: number;
  currentProgress: number;
  unlocked: boolean;
}

function AchievementsDashboard() {
  const { data: achievements, refetch: refetchAchievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements/progress"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    refetchAchievements();
  }, [refetchAchievements]);

  const groupedAchievements = achievements?.reduce<Record<string, Achievement[]>>((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Achievement Progress
          </h1>
          <p className="text-muted-foreground">
            Track your BJJ journey
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedAchievements || {}).map(([category, catAchievements]) => {
          const IconComponent = {
            TECHNIQUE_MASTERY: Brain,
            TRAINING_CONSISTENCY: Clock,
            SUBMISSION_MASTERY: Target,
            ESCAPE_MASTERY: Brain,
            FOCUS_AREA: Dumbbell
          }[category as keyof typeof AchievementCategory] || Brain;

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5" />
                  <CardTitle className="text-lg capitalize">
                    {category.toLowerCase().replace('_', ' ')}
                  </CardTitle>
                </div>
                <CardDescription>
                  {catAchievements.length} achievements available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {catAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{achievement.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <Progress
                      value={(achievement.currentProgress / achievement.progressMax) * 100}
                    />
                    <p className="text-xs text-right mt-1">
                      {achievement.currentProgress} / {achievement.progressMax}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default AchievementsDashboard;