import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, UserMinus } from "lucide-react";

export default function CommunityPage() {
  const { user } = useAuth();
  
  const { data: followers } = useQuery<User[]>({
    queryKey: ["/api/followers"]
  });

  const { data: following } = useQuery<User[]>({
    queryKey: ["/api/following"]
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              BJJ Community
            </h1>
            <p className="text-muted-foreground">Connect with fellow practitioners</p>
          </div>
          <Users className="h-8 w-8 text-primary" />
        </div>

        <Tabs defaultValue="followers" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="followers">
              Followers ({followers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          <TabsContent value="following">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
