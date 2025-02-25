import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Lock, Check, Trophy, Star } from "lucide-react";
import { type Technique } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const BELT_RANKS = ["white", "blue", "purple", "brown", "black"] as const;

function TechniqueCard({ technique, canUnlock, onUnlock }: { 
  technique: Technique & { canUnlock?: boolean }; 
  canUnlock: boolean;
  onUnlock: () => void;
}) {
  return (
    <Card className={`transition-all duration-200 ${technique.isUnlocked ? "border-primary/50 bg-primary/5" : "opacity-75"}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {technique.name}
            {technique.isUnlocked ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardTitle>
          <Badge variant={technique.isUnlocked ? "default" : "outline"} className="capitalize">
            {technique.position}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {technique.difficulty} Belt
          </Badge>
          {technique.prerequisites && technique.prerequisites.length > 0 && (
            <Badge variant={canUnlock ? "outline" : "destructive"} className="flex items-center gap-1">
              {canUnlock ? (
                <Check className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {technique.prerequisites.length} Prerequisites
            </Badge>
          )}
          {technique.isUnlocked && (
            <Badge variant="secondary" className="ml-auto">
              <Star className="h-3 w-3 mr-1" />
              {technique.points} Points
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{technique.description}</p>
        {!technique.isUnlocked && (
          <Button 
            onClick={onUnlock}
            disabled={!canUnlock}
            variant="outline"
            className="w-full"
          >
            <Trophy className="h-4 w-4 mr-2" />
            {canUnlock ? "Unlock Technique" : "Prerequisites Required"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function TechniqueLibrary() {
  const { toast } = useToast();

  const { data: progress } = useQuery({
    queryKey: ["/api/techniques/progress"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/techniques/progress");
      return res.json();
    }
  });

  const { data: pointsSummary } = useQuery({
    queryKey: ["/api/points/summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/points/summary");
      return res.json();
    }
  });

  const unlockMutation = useMutation({
    mutationFn: async (techniqueId: number) => {
      const res = await apiRequest("POST", `/api/techniques/${techniqueId}/unlock`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to unlock technique");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/techniques/belt"] });
      queryClient.invalidateQueries({ queryKey: ["/api/techniques/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/summary"] });
      toast({
        title: "Success!",
        description: "You've unlocked a new technique and earned points!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unlock technique",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Technique Library</h1>
          {pointsSummary && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{pointsSummary.totalPoints} Points</span>
              </div>
              <Badge variant="outline">Level {pointsSummary.level}</Badge>
            </div>
          )}
        </div>

        {progress && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {progress.map((belt) => (
              <Card key={belt.beltRank}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize flex items-center justify-between">
                    {belt.beltRank} Belt
                    <span className="text-sm font-normal">
                      {belt.unlocked} / {belt.total}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Progress value={belt.percentage} className="flex-1" />
                    <span className="text-sm font-medium">{Math.round(belt.percentage)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="white" className="w-full">
          <TabsList className="mb-8">
            {BELT_RANKS.map((rank) => (
              <TabsTrigger key={rank} value={rank} className="capitalize">
                {rank}
              </TabsTrigger>
            ))}
          </TabsList>

          {BELT_RANKS.map((rank) => (
            <TabsContent key={rank} value={rank}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TechniqueBeltContent
                  rank={rank}
                  onUnlock={(id) => unlockMutation.mutate(id)}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function TechniqueBeltContent({ rank, onUnlock }: { rank: string; onUnlock: (id: number) => void }) {
  const { data: techniques } = useQuery({
    queryKey: ["/api/techniques/belt", rank],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/techniques/belt/${rank}`);
      if (!res.ok) {
        throw new Error("Failed to fetch techniques");
      }
      return res.json();
    }
  });

  if (!techniques || techniques.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <h3 className="text-xl font-semibold text-muted-foreground">No Techniques Yet</h3>
        <p className="text-muted-foreground mt-2">Check back later for new techniques</p>
      </div>
    );
  }

  return techniques.map((technique: any) => (
    <TechniqueCard
      key={technique.id}
      technique={technique}
      canUnlock={technique.canUnlock}
      onUnlock={() => onUnlock(technique.id)}
    />
  ));
}