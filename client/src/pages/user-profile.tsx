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
import { mockTrainingLogs, mockUserStats } from "@/lib/mock-data";

function UserProfile() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState("activity");

  const { data: profile } = useQuery({
    queryKey: ["/api/users", id],
    queryFn: async () => {
      // For now, return mock data
      return {
        id: parseInt(id!),
        username: "JohnDoe",
        beltRank: "Purple",
        gym: "Gracie Barra HQ",
        isFollowing: false,
      };
    },
  });

  const { data: activityFeed = mockTrainingLogs } = useQuery({
    queryKey: ["/api/users", id, "activity"],
  });

  const { data: userStats = mockUserStats } = useQuery({
    queryKey: ["/api/users", id, "stats"],
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/follow/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/unfollow/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
    },
  });

  if (!profile) {
    return <div>Loading...</div>;
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
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{profile.username}</h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {profile.gym}
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
                    >
                      <UserMinus className="h-4 w-4" />
                      Unfollow
                    </Button>
                  ) : (
                    <Button
                      className="gap-2"
                      onClick={() => followMutation.mutate()}
                    >
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Calendar, label: "Sessions", value: userStats.totalSessions },
              { icon: Clock, label: "Hours", value: userStats.totalHours },
              { icon: Dumbbell, label: "Techniques", value: userStats.techniquesLearned },
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity">Training Activity</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {activityFeed.map((log) => (
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
                                {log.techniquesPracticed.map((technique, index) => (
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

            <TabsContent value="achievements" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userStats.achievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{achievement.name}</CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {achievement.progress !== undefined && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {achievement.progress}/{achievement.required}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${(achievement.progress! / achievement.required!) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserProfile;