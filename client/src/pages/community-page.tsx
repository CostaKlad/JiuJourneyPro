import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, UserPlus, UserMinus, MessageSquare, ThumbsUp,
  MapPin, Calendar, Clock, Dumbbell
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="space-y-8 animate-fade-in">
      <header className="text-center space-y-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Community</h1>
          <p className="text-lg text-muted-foreground mt-2">Connect with fellow BJJ practitioners</p>
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="outline" className="btn gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </Button>
          <Button variant="outline" className="btn gap-2">
            <Users className="h-4 w-4" />
            Find Partners
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="space-y-6">
          <Card className="overflow-hidden transition-all duration-300 hover:border-primary/20">
            <div className="relative h-32">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="relative px-6 -mt-12">
              <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary/10">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.username || ''} />
                ) : (
                  <AvatarFallback className="bg-primary/5 text-2xl">
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
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
                <Button variant="outline" size="sm" className="btn">
                  Edit Profile
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div 
                  className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
                >
                  <div className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {followers?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Training Partners</div>
                </div>
                <div 
                  className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
                >
                  <div className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {following?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
              <QuickStats stats={trainingStats} />
            </CardContent>
          </Card>

          {/* Training Partners Section */}
          <Card className="transition-all duration-300 hover:border-primary/20">
            <CardHeader>
              <CardTitle>Find Training Partners</CardTitle>
              <CardDescription>Discover your next training buddy</CardDescription>
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
                    <Link 
                      key={partner.id}
                      href={`/users/${partner.id}`} 
                      className="block transition-transform duration-200 hover:translate-x-1"
                    >
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10">
                            {partner.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{partner.username}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="bg-primary/5">
                              {partner.beltRank}
                            </Badge>
                            {partner.gym && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
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
                          className="shrink-0"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Section */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed" className="group">
                <MessageSquare className="h-4 w-4 mr-2 group-data-[state=active]:text-primary" />
                Activity Feed
              </TabsTrigger>
              <TabsTrigger value="followers" className="group">
                <Users className="h-4 w-4 mr-2 group-data-[state=active]:text-primary" />
                {followers?.length || 0} Followers
              </TabsTrigger>
              <TabsTrigger value="following" className="group">
                <UserPlus className="h-4 w-4 mr-2 group-data-[state=active]:text-primary" />
                {following?.length || 0} Following
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4 mt-6">
              {activityFeed?.map((log) => (
                <Card key={log.id} className="transition-all duration-300 hover:border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      {log.user && (
                        <Link href={`/users/${log.user.id}`}>
                          <Avatar className="h-10 w-10 cursor-pointer transition-transform hover:scale-105">
                            {log.user.avatarUrl && (
                              <AvatarImage src={log.user.avatarUrl} alt={log.user.username} />
                            )}
                            <AvatarFallback className="bg-primary/10">
                              {log.user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            {log.user && (
                              <Link href={`/users/${log.user.id}`}>
                                <span className="font-medium hover:text-primary cursor-pointer">
                                  {log.user.username}
                                </span>
                              </Link>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(log.date), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {log.type.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{log.duration} minutes</span>
                      </div>
                      {log.energyLevel && (
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-muted-foreground" />
                          <span>Energy Level: {log.energyLevel}/5</span>
                        </div>
                      )}
                    </div>

                    {log.techniquesPracticed && log.techniquesPracticed.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Techniques Practiced:</h4>
                        <div className="flex flex-wrap gap-2">
                          {log.techniquesPracticed.map((technique, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-primary/5 hover:bg-primary/10"
                            >
                              {technique}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {log.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
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
                        <ThumbsUp 
                          className={`h-4 w-4 mr-2 transition-colors ${
                            log.hasLiked ? "fill-current" : ""
                          }`}
                        />
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

                    {/* Comments Section */}
                    {log.comments.length > 0 && (
                      <div className="space-y-4 mt-4">
                        {log.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10">
                                {comment.user.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
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
                              <p className="text-sm bg-muted/30 p-2 rounded-lg">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    <form
                      className="flex gap-2 mt-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const input = form.elements.namedItem('comment') as HTMLInputElement;
                        if (input.value.trim()) {
                          commentMutation.mutate({
                            logId: log.id,
                            content: input.value.trim()
                          });
                          input.value = '';
                        }
                      }}
                    >
                      <Input
                        name="comment"
                        placeholder="Add a comment..."
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" className="shrink-0">
                        Comment
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="followers" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followers?.map((follower) => (
                  <Link 
                    key={follower.id}
                    href={`/users/${follower.id}`} 
                    className="block transition-transform duration-200 hover:-translate-y-1"
                  >
                    <Card className="h-full">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <Avatar className="h-12 w-12">
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
                          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {follower.gym}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          className="w-full btn"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {following?.map((followed) => (
                  <Link 
                    key={followed.id}
                    href={`/users/${followed.id}`} 
                    className="block transition-transform duration-200 hover:-translate-y-1"
                  >
                    <Card className="h-full">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <Avatar className="h-12 w-12">
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
                          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {followed.gym}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          className="w-full btn"
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
  );
}

export default CommunityPage;