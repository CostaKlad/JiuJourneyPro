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
  Shield,
  Target,
  Lock,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BJJTechniques, FocusArea } from "@shared/schema";

interface TechniqueCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  techniques: Technique[];
}

interface Technique {
  id: number;
  name: string;
  difficulty: string;
  progress: number;
  isUnlocked: boolean;
}

const mockTechniqueCategories: TechniqueCategory[] = [
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
      },
      {
        id: 2,
        name: "Triangle Choke",
        difficulty: "Fundamental",
        progress: 40,
        isUnlocked: true,
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
      },
      {
        id: 4,
        name: "Cross Collar Choke",
        difficulty: "Intermediate",
        progress: 0,
        isUnlocked: false,
      },
    ],
  },
];

function TechniquePassport() {
  const [selectedCategory, setSelectedCategory] = useState("guard");

  const { data: categories = mockTechniqueCategories } = useQuery<TechniqueCategory[]>({
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
                {Icon && <Icon className="h-4 w-4" />}
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
                  className={cn(
                    "relative",
                    !technique.isUnlocked ? "opacity-75" : ""
                  )}
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
                  <CardContent>
                    <Progress value={technique.progress} />
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