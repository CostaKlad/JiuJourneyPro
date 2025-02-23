import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  UserMinus,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  Dumbbell,
} from "lucide-react";

interface TrainingStats {
  totalSessions: number;
  totalHours: number;
  techniquesLearned: number;
}

function UserProfile() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState("activity");

  const { data: profile, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["/api/users", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${id}`);
      return response.json();
    },
    enabled: !!id
  });

  const { data: activityFeed = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ["/api/users", id, "activity"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${id}/activity`);
      return response.json();
    },
    enabled: !!id
  });

  const { data: userStats, isLoading: isStatsLoading } = useQuery<TrainingStats>({
    queryKey: ["/api/users", id, "stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${id}/stats`);
      return response.json();
    },
    enabled: !!id
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/follow/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      refetchProfile();
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/unfollow/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      refetchProfile();
    }
  });

  if (isLoading || isActivityLoading || isStatsLoading || !profile) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <div className="relative h-48 rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-20" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative px-6 -mt-16">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarFallback className="text-3xl bg-primary/10">
                  {profile.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{profile.username}</h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {profile.gym || "No gym specified"}
                </p>
                <Badge variant="outline" className="mt-2">
                  {profile.beltRank} Belt
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {currentUser?.id !== parseInt(id!) && (
                <>
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                  {profile.isFollowing ? (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => unfollowMutation.mutate()}
                      disabled={unfollowMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4" />
                      {unfollowMutation.isPending ? "Unfollowing..." : "Unfollow"}
                    </Button>
                  ) : (
                    <Button
                      className="gap-2"
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4" />
                      {followMutation.isPending ? "Following..." : "Follow"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Calendar, label: "Sessions", value: userStats?.totalSessions || 0 },
              { icon: Clock, label: "Hours", value: userStats?.totalHours || 0 },
              { icon: Dumbbell, label: "Techniques", value: userStats?.techniquesLearned || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-center"
              >
                <Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <CardContent className="mt-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="activity">Training Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {activityFeed.map((log: any) => (
                    <Card key={log.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">
                            {log.type} Session
                          </CardTitle>
                          <Badge variant="secondary">
                            {new Date(log.date).toLocaleDateString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                              <span className="text-muted-foreground">Duration:</span>{" "}
                              <span className="font-medium">
                                {log.duration} minutes
                              </span>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                              <span className="text-muted-foreground">
                                Energy Level:
                              </span>{" "}
                              <span className="font-medium">{log.energyLevel}/5</span>
                            </div>
                          </div>

                          {log.techniquesPracticed?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Techniques:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {log.techniquesPracticed.map((technique: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="hover:bg-primary/5"
                                  >
                                    {technique}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {log.notes && (
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserProfile;