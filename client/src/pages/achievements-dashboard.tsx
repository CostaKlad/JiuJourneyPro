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
  Clock,
  Brain,
  Target,
  Dumbbell,
} from "lucide-react";
import { AchievementCategory } from "@shared/schema";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: keyof typeof AchievementCategory;
  progressMax: number;
  currentProgress: number;
}

function AchievementsDashboard() {
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements/progress"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
  });

  const groupedAchievements = achievements?.reduce<Record<string, Achievement[]>>((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Progress Tracking
        </h1>
        <p className="text-muted-foreground">
          Track your BJJ journey metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedAchievements || {}).map(([category, catAchievements]) => {
          const IconComponent = {
            TECHNIQUE_MASTERY: Brain,
            TRAINING_CONSISTENCY: Clock,
            SUBMISSION_MASTERY: Target,
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
                  Progress tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {catAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="space-y-2"
                  >
                    <div className="text-sm font-medium">
                      {achievement.name}
                    </div>
                    <Progress
                      value={(achievement.currentProgress / achievement.progressMax) * 100}
                    />
                    <p className="text-xs text-right text-muted-foreground">
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