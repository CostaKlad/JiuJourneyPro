import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { mockUserStats } from "@/lib/mock-data";
import { Trophy, Users, Star, Target, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#FF8042", "#00C49F", "#FFBB28", "#0088FE"];

// Mock data for community achievements
const mockCommunityData = {
  achievementDistribution: [
    { name: "Streak Warriors", value: 45 },
    { name: "Technique Masters", value: 30 },
    { name: "Competition Champs", value: 15 },
    { name: "Teaching Guides", value: 10 },
  ],
  recentUnlocks: [
    {
      id: 1,
      username: "AliceSmith",
      achievement: "Tournament Veteran",
      timestamp: "2024-02-22T10:30:00Z",
    },
    {
      id: 2,
      username: "BobJohnson",
      achievement: "Knowledge Sharer",
      timestamp: "2024-02-22T09:15:00Z",
    },
    {
      id: 3,
      username: "CarolWhite",
      achievement: "Consistent Warrior",
      timestamp: "2024-02-22T08:45:00Z",
    },
  ],
  leaderboard: [
    {
      username: "AliceSmith",
      beltRank: "Purple",
      totalAchievements: 15,
      recentAchievement: "Tournament Veteran",
    },
    {
      username: "BobJohnson",
      beltRank: "Brown",
      totalAchievements: 12,
      recentAchievement: "Knowledge Sharer",
    },
    {
      username: "CarolWhite",
      beltRank: "Black",
      totalAchievements: 20,
      recentAchievement: "Technique Master",
    },
  ],
  monthlyProgress: [
    { month: "Jan", achievements: 24 },
    { month: "Feb", achievements: 30 },
    { month: "Mar", achievements: 28 },
    { month: "Apr", achievements: 35 },
    { month: "May", achievements: 40 },
    { month: "Jun", achievements: 45 },
  ],
};

function AchievementsDashboard() {
  const [selectedView, setSelectedView] = useState("overview");

  const { data: communityData = mockCommunityData } = useQuery({
    queryKey: ["/api/community/achievements"],
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Community Achievements
          </h1>
          <p className="text-muted-foreground">
            Track and celebrate our community's progress
          </p>
        </div>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Recent Unlocks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Achievement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Distribution</CardTitle>
                <CardDescription>
                  Types of achievements unlocked by the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={communityData.achievementDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {communityData.achievementDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Progress</CardTitle>
                <CardDescription>
                  Achievement unlocks over the past months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={communityData.monthlyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="achievements"
                        fill="#8884d8"
                        name="Achievements Unlocked"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Leaders</CardTitle>
              <CardDescription>
                Top performers in our community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communityData.leaderboard.map((user, index) => (
                  <div
                    key={user.username}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-2xl text-muted-foreground w-8">
                        #{index + 1}
                      </div>
                      <Avatar>
                        <AvatarFallback>
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{user.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.beltRank} Belt
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {user.totalAchievements} Achievements
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {user.recentAchievement}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievement Unlocks</CardTitle>
              <CardDescription>
                Latest achievements unlocked by community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communityData.recentUnlocks.map((unlock) => (
                  <div
                    key={unlock.id}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {unlock.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{unlock.username}</div>
                      <div className="text-sm text-muted-foreground">
                        Unlocked "{unlock.achievement}"
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(unlock.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AchievementsDashboard;
