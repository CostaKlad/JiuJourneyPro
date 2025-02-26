import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card className={`group relative overflow-hidden transition-all duration-200 hover:border-primary/50 ${
      technique.isUnlocked ? "bg-primary/5" : ""
    }`}>
      <div className="absolute right-4 top-4">
        {technique.isUnlocked ? (
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            <Check className="h-3 w-3" />
            Unlocked
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium">
            <Lock className="h-3 w-3" />
            Locked
          </div>
        )}
      </div>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle>{technique.name}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {technique.position}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {technique.difficulty} Belt
            </Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{technique.description}</p>
        {!technique.isUnlocked && (
          <div className="space-y-3">
            {technique.prerequisites && technique.prerequisites.length > 0 && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="font-medium">Prerequisites:</div>
                <div className="mt-1 text-muted-foreground">
                  Unlock required techniques first
                </div>
              </div>
            )}
            <Button
              onClick={onUnlock}
              disabled={!canUnlock}
              className="w-full"
              variant={canUnlock ? "default" : "outline"}
            >
              <Trophy className="mr-2 h-4 w-4" />
              {canUnlock ? "Unlock Technique" : "Prerequisites Required"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BeltProgressCard({ belt, nextBelt, totalPoints }: { belt: any; nextBelt: any; totalPoints: number }) {
  const getBeltColor = (beltRank: string) => {
    switch (beltRank) {
      case "white": return "bg-gray-200";
      case "blue": return "bg-blue-600";
      case "purple": return "bg-purple-600";
      case "brown": return "bg-amber-800";
      case "black": return "bg-black";
      default: return "bg-gray-200";
    }
  };

  const getRequiredPoints = (belt: string) => {
    switch (belt) {
      case "white": return 100;
      case "blue": return 300;
      case "purple": return 600;
      case "brown": return 1000;
      case "black": return Infinity;
      default: return 100;
    }
  };

  const currentRequired = getRequiredPoints(belt.beltRank);
  const nextRequired = getRequiredPoints(nextBelt?.beltRank);
  const progress = (totalPoints / currentRequired) * 100;

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:border-primary/50">
      <div className={`absolute inset-y-0 left-0 w-1 ${getBeltColor(belt.beltRank)}`} />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getBeltColor(belt.beltRank)}`} />
            <span className="capitalize">{belt.beltRank} Belt</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {belt.unlocked} / {belt.total}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Techniques Progress</span>
              <span>{Math.round(belt.percentage)}%</span>
            </div>
            <Progress
              value={belt.percentage}
              className="h-2"
              indicatorClassName={belt.percentage === 100 ? "bg-green-500" : getBeltColor(belt.beltRank)}
            />
          </div>
          {nextBelt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Next Rank: {nextBelt.beltRank}</span>
                <span>{totalPoints} / {nextRequired}</span>
              </div>
              <Progress
                value={progress}
                className="h-2"
                indicatorClassName={getBeltColor(nextBelt.beltRank)}
              />
              <div className="mt-2 text-sm text-muted-foreground">
                <div>Requirements:</div>
                <ul className="ml-4 list-disc">
                  <li>Unlock {Math.max(0, belt.total - belt.unlocked)} more techniques</li>
                  <li>Earn {Math.max(0, nextRequired - totalPoints)} more points</li>
                </ul>
              </div>
            </div>
          )}
        </div>
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
    },
  });

  const { data: pointsSummary } = useQuery({
    queryKey: ["/api/points/summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/points/summary");
      return res.json();
    },
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Technique Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Master techniques and track your progress through the ranks
          </p>
        </div>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {progress.map((belt, index) => (
            <BeltProgressCard
              key={belt.beltRank}
              belt={belt}
              nextBelt={index < progress.length - 1 ? progress[index + 1] : null}
              totalPoints={pointsSummary?.totalPoints || 0}
            />
          ))}
        </div>
      )}

      <Tabs defaultValue="white" className="w-full">
        <TabsList>
          {BELT_RANKS.map((rank) => (
            <TabsTrigger key={rank} value={rank} className="capitalize">
              {rank}
            </TabsTrigger>
          ))}
        </TabsList>

        {BELT_RANKS.map((rank) => (
          <TabsContent key={rank} value={rank}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <TechniqueBeltContent
                rank={rank}
                onUnlock={(id) => unlockMutation.mutate(id)}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
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
    },
  });

  if (!techniques || techniques.length === 0) {
    return (
      <div className="col-span-full py-12 text-center">
        <h3 className="text-xl font-semibold text-muted-foreground">No Techniques Yet</h3>
        <p className="mt-2 text-muted-foreground">Check back later for new techniques</p>
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