import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User, TrainingLog } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, UserMinus, MessageSquare, ThumbsUp, Medal, Trophy } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ExtendedTrainingLog = TrainingLog & {
  user: User;
  likes: number;
  hasLiked: boolean;
  comments: Comment[];
};

type Comment = {
  id: number;
  content: string;
  user: User;
  createdAt: string;
};

export default function CommunityPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("feed");

  const { data: followers } = useQuery<User[]>({
    queryKey: ["/api/followers"]
  });

  const { data: following } = useQuery<User[]>({
    queryKey: ["/api/following"]
  });

  const { data: activityFeed } = useQuery<ExtendedTrainingLog[]>({
    queryKey: ["/api/community/feed"]
  });

  const { data: suggestedPartners } = useQuery<User[]>({
    queryKey: ["/api/community/suggestions"]
  });

  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", `/api/follow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", `/api/unfollow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (logId: number) => {
      await apiRequest("POST", `/api/training-logs/${logId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async ({ logId, content }: { logId: number; content: string }) => {
      await apiRequest("POST", `/api/training-logs/${logId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    }
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Ossify Community
            </h1>
            <p className="text-muted-foreground">Connect and grow with fellow BJJ practitioners</p>
          </div>
          <Users className="h-8 w-8 text-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl">
                      {user?.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.username}</h3>
                    <p className="text-sm text-muted-foreground">{user?.beltRank} Belt</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                    <div className="text-2xl font-bold">{followers?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                    <div className="text-2xl font-bold">{following?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discover Training Partners</CardTitle>
                <CardDescription>Connect with practitioners at your level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestedPartners?.map((partner) => (
                    <div key={partner.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10">
                          {partner.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{partner.username}</div>
                        <p className="text-sm text-muted-foreground">{partner.beltRank} Belt</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => followMutation.mutate(partner.id)}
                        className="hover:bg-primary/20"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Activity Feed
                </TabsTrigger>
                <TabsTrigger value="followers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Followers ({followers?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="following" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Following ({following?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6">
                {activityFeed?.map((log) => (
                  <Card key={log.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start gap-4 pb-2">
                      <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                        <AvatarFallback className="bg-primary/10">
                          {log.user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg hover:text-primary cursor-pointer">
                              {log.user.username}
                            </CardTitle>
                            <CardDescription>
                              {formatDistanceToNow(new Date(log.date), { addSuffix: true })}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {log.type.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg text-sm">
                          <div>
                            <span className="text-muted-foreground">Duration:</span>{" "}
                            <span className="font-medium">{log.duration} minutes</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Energy Level:</span>{" "}
                            <span className="font-medium">{log.energyLevel}/5</span>
                          </div>
                        </div>

                        {log.techniquesPracticed?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Techniques:</h4>
                            <div className="flex flex-wrap gap-2">
                              {log.techniquesPracticed.map((technique, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline"
                                  className="hover:bg-primary/5 cursor-pointer"
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

                        <div className="flex items-center gap-4 pt-4 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => likeMutation.mutate(log.id)}
                            className={`hover:bg-primary/10 ${log.hasLiked ? "text-primary" : ""}`}
                          >
                            <ThumbsUp className={`h-4 w-4 mr-2 ${log.hasLiked ? "fill-current" : ""}`} />
                            {log.likes}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-primary/10"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {log.comments.length}
                          </Button>
                        </div>

                        {log.comments.length > 0 && (
                          <ScrollArea className="h-40 rounded-lg border p-4">
                            <div className="space-y-4">
                              {log.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 group">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {comment.user.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium hover:text-primary cursor-pointer">
                                        {comment.user.username}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.createdAt), {
                                          addSuffix: true,
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-sm mt-1 bg-muted/50 p-2 rounded-lg">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}

                        <div className="flex gap-4">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user?.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <form
                            className="flex-1 flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const input = form.elements.namedItem('comment') as HTMLInputElement;
                              if (input.value.trim()) {
                                commentMutation.mutate({
                                  logId: log.id,
                                  content: input.value
                                });
                                input.value = '';
                              }
                            }}
                          >
                            <Input
                              name="comment"
                              placeholder="Share your thoughts..."
                              className="flex-1"
                            />
                            <Button type="submit" size="sm">
                              Comment
                            </Button>
                          </form>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="followers" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {followers?.map((follower) => (
                    <Card key={follower.id}>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10">
                            {follower.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{follower.username}</CardTitle>
                          <p className="text-sm text-muted-foreground">{follower.beltRank} Belt</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {follower.gym && (
                          <p className="text-sm mb-4">Trains at: {follower.gym}</p>
                        )}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => followMutation.mutate(follower.id)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Follow Back
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="following" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {following?.map((followed) => (
                    <Card key={followed.id}>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10">
                            {followed.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{followed.username}</CardTitle>
                          <p className="text-sm text-muted-foreground">{followed.beltRank} Belt</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {followed.gym && (
                          <p className="text-sm mb-4">Trains at: {followed.gym}</p>
                        )}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => unfollowMutation.mutate(followed.id)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Unfollow
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}