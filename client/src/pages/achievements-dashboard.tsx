import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Star,
  Target,
  Award,
  Medal,
  Shield,
  BookOpen,
  Flame,
  Clock,
  Dumbbell,
  Brain,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AchievementCategory, AchievementTier } from "@shared/schema";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: keyof typeof AchievementCategory;
  tier: keyof typeof AchievementTier;
  progressMax: number;
  currentProgress: number;
  unlocked: boolean;
  howToEarn: string;
}

const TIER_COLORS = {
  BRONZE: "bg-orange-100 text-orange-800 border-orange-200",
  SILVER: "bg-gray-100 text-gray-800 border-gray-200",
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DIAMOND: "bg-blue-100 text-blue-800 border-blue-200"
} as const;

const CATEGORY_ICONS: Record<keyof typeof AchievementCategory, LucideIcon> = {
  TECHNIQUE_MASTERY: Brain,
  TRAINING_CONSISTENCY: Clock,
  SUBMISSION_MASTERY: Target,
  ESCAPE_MASTERY: Shield,
  FOCUS_AREA: Dumbbell
};

function AchievementsDashboard() {
  const [selectedView, setSelectedView] = useState("overview");

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements/progress"],
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Achievement Progress
          </h1>
          <p className="text-muted-foreground">
            Track your BJJ journey and unlock achievements
          </p>
        </div>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="howto" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            How to Earn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedAchievements || {}).map(([category, catAchievements]) => {
              const IconComponent = CATEGORY_ICONS[category as keyof typeof AchievementCategory];
              return (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="h-5 w-5" />}
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
                        className={cn(
                          "p-4 rounded-lg border",
                          achievement.unlocked
                            ? TIER_COLORS[achievement.tier]
                            : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <Badge variant={achievement.unlocked ? "default" : "outline"}>
                            {achievement.tier}
                          </Badge>
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
        </TabsContent>

        <TabsContent value="howto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How to Earn Achievements</CardTitle>
              <CardDescription>
                Guide to unlocking achievements in each category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Technique Mastery
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Technique Explorer</h4>
                    <p className="text-sm text-muted-foreground">Log and practice 5 different techniques</p>
                    <Badge variant="outline" className="mt-2">Bronze</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Technique Master</h4>
                    <p className="text-sm text-muted-foreground">Successfully practice a technique 15 times</p>
                    <Badge variant="outline" className="mt-2">Gold</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Submission Mastery
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Submission Hunter</h4>
                    <p className="text-sm text-muted-foreground">Successfully execute 3 submissions</p>
                    <Badge variant="outline" className="mt-2">Bronze</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Submission Expert</h4>
                    <p className="text-sm text-muted-foreground">Successfully execute 40 submissions</p>
                    <Badge variant="outline" className="mt-2">Diamond</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Escape Mastery
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Escape Artist</h4>
                    <p className="text-sm text-muted-foreground">Successfully perform 3 escapes</p>
                    <Badge variant="outline" className="mt-2">Bronze</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Grand Defender</h4>
                    <p className="text-sm text-muted-foreground">Successfully perform 40 escapes</p>
                    <Badge variant="outline" className="mt-2">Diamond</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Training Consistency
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Dedicated Student</h4>
                    <p className="text-sm text-muted-foreground">Log 5 training sessions</p>
                    <Badge variant="outline" className="mt-2">Bronze</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Mat Warrior</h4>
                    <p className="text-sm text-muted-foreground">Complete 100 training sessions</p>
                    <Badge variant="outline" className="mt-2">Diamond</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Focus Areas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Well-Rounded</h4>
                    <p className="text-sm text-muted-foreground">Train in 3 different focus areas</p>
                    <Badge variant="outline" className="mt-2">Bronze</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Area Specialist</h4>
                    <p className="text-sm text-muted-foreground">Complete 50 sessions in a single focus area</p>
                    <Badge variant="outline" className="mt-2">Diamond</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Progress</CardTitle>
                <CardDescription>
                  Your journey across all categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(groupedAchievements || {}).map(([category, achievements]) => {
                    const unlockedCount = achievements.filter(a => a.unlocked).length;
                    const totalCount = achievements.length;
                    const Icon = CATEGORY_ICONS[category as keyof typeof AchievementCategory];

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4" />}
                            <span className="capitalize">{category.toLowerCase().replace('_', ' ')}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {unlockedCount} / {totalCount}
                          </span>
                        </div>
                        <Progress value={(unlockedCount / totalCount) * 100} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Achievements</CardTitle>
                <CardDescription>
                  Achievements close to unlocking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(groupedAchievements || {})
                    .flat()
                    .filter(achievement => !achievement.unlocked && achievement.currentProgress > 0)
                    .sort((a, b) => (b.currentProgress / b.progressMax) - (a.currentProgress / a.progressMax))
                    .slice(0, 5)
                    .map(achievement => (
                      <div key={achievement.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{achievement.name}</span>
                          <Badge variant="outline">{achievement.tier}</Badge>
                        </div>
                        <Progress
                          value={(achievement.currentProgress / achievement.progressMax) * 100}
                        />
                        <p className="text-xs text-right">
                          {achievement.currentProgress} / {achievement.progressMax}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AchievementsDashboard;