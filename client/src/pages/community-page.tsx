import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, UserPlus, UserMinus, MessageSquare, ThumbsUp,
  MapPin, Plus, Calendar, Clock, Dumbbell
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
//import { mockFollowers, mockFollowing, mockTrainingLogs, mockSuggestedPartners } from "@/lib/mock-data";
import { Link } from "wouter";

type TrainingLogComment = {
  id: number;
  user: ExtendedUser;
  content: string;
  createdAt: string;
};

type TrainingLogEntry = {
  id: number;
  userId: number;
  date: string;
  type: string;
  duration: number;
  energyLevel?: number;
  techniquesPracticed?: string[];
  notes?: string;
  likes: number;
  hasLiked: boolean;
  comments: TrainingLogComment[];
  user?: ExtendedUser; // Make user optional since it might not be populated
};

type ExtendedUser = Pick<User, 'id' | 'username' | 'beltRank' | 'gym' | 'avatarUrl'>;

interface TrainingStats {
  totalSessions: number;
  totalHours: number;
  techniquesLearned: number;
}

const BELT_COLORS: Record<string, string> = {
  white: "#FFFFFF",
  blue: "#0066CC",
  purple: "#660099",
  brown: "#8B4513",
  black: "#000000"
};

function BeltProgressIndicator({ belt, stripes }: { belt: string; stripes: number }) {
  const beltColor = BELT_COLORS[belt.toLowerCase()] || BELT_COLORS.white;

  return (
    <div className="relative w-full h-8 bg-muted rounded-md overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: beltColor, opacity: 0.2 }}
      />
      <div className="absolute inset-0 flex items-center justify-end p-1 gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-6 rounded-full ${
              i < stripes ? "bg-yellow-400" : "bg-gray-300 opacity-30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function QuickStats({ stats }: { stats: TrainingStats }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {[
        { icon: Calendar, label: "Sessions", value: stats.totalSessions },
        { icon: Clock, label: "Hours", value: Math.round(stats.totalHours) },
        { icon: Dumbbell, label: "Techniques", value: stats.techniquesLearned },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex flex-col items-center p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
          <Icon className="h-4 w-4 mb-1 text-primary" />
          <span className="text-lg font-bold">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

function CommunityPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("feed");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const { data: followers } = useQuery<ExtendedUser[]>({
    queryKey: ["/api/followers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/followers");
      return response.json();
    }
  });

  const { data: following } = useQuery<ExtendedUser[]>({
    queryKey: ["/api/following"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/following");
      return response.json();
    }
  });

  const { data: activityFeed } = useQuery<TrainingLogEntry[]>({
    queryKey: ["/api/community/feed"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/community/feed");
      return response.json();
    },
    staleTime: 30000,
    retry: false
  });

  const { data: suggestedPartners } = useQuery<ExtendedUser[]>({
    queryKey: ["/api/community/suggestions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/community/suggestions");
      return response.json();
    },
    staleTime: 30000,
    retry: false
  });

  const { data: trainingStats = { totalSessions: 0, totalHours: 0, techniquesLearned: 0 } } = useQuery<TrainingStats>({
    queryKey: ["/api/training/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/training/stats");
      return response.json();
    },
    staleTime: 30000,
    retry: false
  });

  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", `/api/follow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/suggestions"] });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", `/api/unfollow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/suggestions"] });
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

  if (!user) {
    return (
      <div className="p-6">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Community
            </h1>
            <p className="text-muted-foreground">Connect with fellow BJJ practitioners</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </Button>
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Find Partners
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card>
              <div className="relative h-32 rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-20" />
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
              </div>

              <div className="relative px-6 -mt-12">
                <Avatar className="h-24 w-24 border-4 border-background">
                  {user?.avatarUrl && (
                    <AvatarImage 
                      src={user.avatarUrl} 
                      alt={user.username || ''}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  )}
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <CardHeader className="pt-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{user?.username}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {user?.gym || "Add your gym"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{user?.beltRank} Belt</span>
                    <span className="text-sm text-muted-foreground">2 Stripes</span>
                  </div>
                  <BeltProgressIndicator belt={user?.beltRank || 'white'} stripes={2} />
                </div>

                <QuickStats stats={trainingStats} />

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                    <div className="text-2xl font-bold">{followers?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Training Partners</div>
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
                <CardDescription>Find the perfect training match</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by Belt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Belts</SelectItem>
                        <SelectItem value="white">White Belt</SelectItem>
                        <SelectItem value="blue">Blue Belt</SelectItem>
                        <SelectItem value="purple">Purple Belt</SelectItem>
                        <SelectItem value="brown">Brown Belt</SelectItem>
                        <SelectItem value="black">Black Belt</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="nearby">Nearby (5mi)</SelectItem>
                        <SelectItem value="city">Same City</SelectItem>
                        <SelectItem value="gym">Same Gym</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    {suggestedPartners?.map((partner) => (
                      <Link href={`/users/${partner.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 transition-colors" key={partner.id}>
                        <Avatar>
                          <AvatarFallback className="bg-primary/10">
                            {partner.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{partner.username}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="bg-primary/5">
                              {partner.beltRank}
                            </Badge>
                            {partner.gym && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {partner.gym}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            followMutation.mutate(partner.id);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </Link>
                    ))}
                  </div>
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
                  <Card key={log.id}>
                    <CardHeader className="flex flex-row items-start gap-4">
                      {log.user && (
                        <Link href={`/users/${log.user.id}`}>
                          <Avatar className="h-10 w-10">
                            {log.user.avatarUrl && (
                              <AvatarImage
                                src={log.user.avatarUrl}
                                alt={log.user.username}
                                onError={(e) => {
                                  // If image fails to load, fallback will show
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                }}
                              />
                            )}
                            <AvatarFallback className="bg-primary/10">
                              {log.user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            {log.user && (
                              <Link href={`/users/${log.user.id}`}>
                                <CardTitle className="text-lg hover:text-primary">
                                  {log.user.username}
                                </CardTitle>
                              </Link>
                            )}
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
                          {log.energyLevel && (
                            <div>
                              <span className="text-muted-foreground">Energy Level:</span>{" "}
                              <span className="font-medium">{log.energyLevel}/5</span>
                            </div>
                          )}
                        </div>

                        {log.techniquesPracticed && log.techniquesPracticed.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Techniques:</h4>
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
                                <div key={comment.id} className="flex gap-4">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {comment.user.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium hover:text-primary">
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
                              {user?.username?.slice(0, 2).toUpperCase()}
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
                    <Link href={`/users/${follower.id}`} className="block" key={follower.id}>
                      <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                          <Avatar>
                            {follower.avatarUrl ? (
                              <AvatarImage src={follower.avatarUrl} alt={follower.username} />
                            ) : (
                              <AvatarFallback className="bg-primary/10">
                                {follower.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
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
                            onClick={(e) => {
                              e.preventDefault();
                              followMutation.mutate(follower.id);
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Follow Back
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="following" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {following?.map((followed) => (
                    <Link href={`/users/${followed.id}`} className="block" key={followed.id}>
                      <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                          <Avatar>
                            {followed.avatarUrl ? (
                              <AvatarImage src={followed.avatarUrl} alt={followed.username} />
                            ) : (
                              <AvatarFallback className="bg-primary/10">
                                {followed.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
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
                            onClick={(e) => {
                              e.preventDefault();
                              unfollowMutation.mutate(followed.id);
                            }}
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Unfollow
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
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

export default CommunityPage;