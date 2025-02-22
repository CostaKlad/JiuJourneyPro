import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Shield,
  Swords,
  Target,
  Award,
  CheckCircle2,
  Lock,
} from "lucide-react";

// Mock data for initial development
const mockTechniqueCategories = [
  {
    id: "guard",
    name: "Guard Techniques",
    icon: Shield,
    techniques: [
      {
        id: 1,
        name: "Armbar from Closed Guard",
        difficulty: "Fundamental",
        progress: 75,
        isUnlocked: true,
        achievements: [
          { id: 1, name: "First Attempt", completed: true },
          { id: 2, name: "Perfect Execution", completed: false },
          { id: 3, name: "Teaching Others", completed: false },
        ],
      },
      {
        id: 2,
        name: "Triangle Choke",
        difficulty: "Fundamental",
        progress: 40,
        isUnlocked: true,
        achievements: [
          { id: 1, name: "First Attempt", completed: true },
          { id: 2, name: "Perfect Execution", completed: false },
          { id: 3, name: "Teaching Others", completed: false },
        ],
      },
    ],
  },
  {
    id: "mount",
    name: "Mount Techniques",
    icon: Target,
    techniques: [
      {
        id: 3,
        name: "Basic Mount Escape",
        difficulty: "Fundamental",
        progress: 90,
        isUnlocked: true,
        achievements: [
          { id: 1, name: "First Attempt", completed: true },
          { id: 2, name: "Perfect Execution", completed: true },
          { id: 3, name: "Teaching Others", completed: false },
        ],
      },
      {
        id: 4,
        name: "Cross Collar Choke",
        difficulty: "Intermediate",
        progress: 0,
        isUnlocked: false,
        achievements: [
          { id: 1, name: "First Attempt", completed: false },
          { id: 2, name: "Perfect Execution", completed: false },
          { id: 3, name: "Teaching Others", completed: false },
        ],
      },
    ],
  },
];

function TechniquePassport() {
  const [selectedCategory, setSelectedCategory] = useState("guard");

  const { data: categories = mockTechniqueCategories } = useQuery({
    queryKey: ["/api/technique-passport/categories"],
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          BJJ Technique Passport
        </h1>
        <p className="text-muted-foreground">
          Track your journey through Brazilian Jiu-Jitsu techniques
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.techniques.map((technique) => (
                <Card
                  key={technique.id}
                  className={`relative ${
                    !technique.isUnlocked ? "opacity-75" : ""
                  }`}
                >
                  {!technique.isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg z-10">
                      <div className="text-center p-4">
                        <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Complete previous techniques to unlock
                        </p>
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{technique.name}</CardTitle>
                        <CardDescription>
                          Difficulty: {technique.difficulty}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={technique.progress === 100 ? "default" : "outline"}
                        className="bg-primary/20"
                      >
                        {technique.progress}% Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={technique.progress} />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Achievements</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {technique.achievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                          >
                            {achievement.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Award className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span
                              className={
                                achievement.completed
                                  ? "text-green-500"
                                  : "text-muted-foreground"
                              }
                            >
                              {achievement.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default TechniquePassport;
