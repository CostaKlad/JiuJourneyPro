import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Send
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileCommentSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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

  const form = useForm({
    resolver: zodResolver(insertProfileCommentSchema),
    defaultValues: {
      content: ""
    }
  });

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ["/api/users", id, "comments"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${id}/comments`);
      return response.json();
    },
    enabled: !!id
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      await apiRequest("POST", `/api/users/${id}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "comments"] });
      form.reset();
    }
  });

  if (isLoading || isActivityLoading || isStatsLoading || isCommentsLoading || !profile) {
    return <div className="container mx-auto p-4">
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card>
        <div className="relative h-32 sm:h-48 rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-20" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative px-4 sm:px-6 -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background">
                {profile.avatarUrl && (
                  <AvatarImage
                    src={profile.avatarUrl}
                    alt={profile.username}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                )}
                <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10">
                  {profile.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{profile.username}</h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {profile.gym || "No gym specified"}
                </p>
                <Badge variant="outline" className="mt-2">
                  {profile.beltRank} Belt
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
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

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-8">
            {[
              { icon: Calendar, label: "Sessions", value: userStats?.totalSessions || 0 },
              { icon: Clock, label: "Hours", value: userStats?.totalHours || 0 },
              { icon: Dumbbell, label: "Techniques", value: userStats?.techniquesLearned || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="p-3 sm:p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-center"
              >
                <Icon className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-2 text-primary" />
                <div className="text-xl sm:text-2xl font-bold">{value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <CardContent className="mt-6 sm:mt-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity">Training Activity</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-6">
              <ScrollArea className="h-[500px] sm:h-[600px]">
                <div className="space-y-4">
                  {activityFeed.map((log: any) => (
                    <Card key={log.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base sm:text-lg">
                            {log.type} Session
                          </CardTitle>
                          <Badge variant="secondary">
                            {new Date(log.date).toLocaleDateString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-muted rounded-lg">
                              <span className="text-muted-foreground">Duration:</span>{" "}
                              <span className="font-medium">
                                {log.duration} minutes
                              </span>
                            </div>
                            <div className="p-2 sm:p-3 bg-muted rounded-lg">
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
            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comments</CardTitle>
                  <CardDescription>
                    Join the conversation and share your thoughts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentUser?.id !== parseInt(id!) && (
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit((data) => commentMutation.mutate(data))}
                        className="flex items-center gap-2 mb-6"
                      >
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Write a comment..."
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="gap-2"
                          disabled={commentMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Send comment</span>
                        </Button>
                      </form>
                    </Form>
                  )}

                  <ScrollArea className="h-[400px] sm:h-[500px]">
                    <div className="space-y-4">
                      {comments.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
                        >
                          <Avatar className="h-8 w-8">
                            {comment.commenter.avatarUrl ? (
                              <AvatarImage
                                src={comment.commenter.avatarUrl}
                                alt={comment.commenter.username}
                              />
                            ) : (
                              <AvatarFallback>
                                {comment.commenter.username?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <Link href={`/users/${comment.commenter.id}`}>
                                <a className="font-medium hover:underline truncate">
                                  {comment.commenter.username}
                                </a>
                              </Link>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 text-sm break-words">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserProfile;