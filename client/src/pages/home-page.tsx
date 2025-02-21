import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { TrainingLog, insertTrainingLogSchema } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  PlusIcon,
  TimerIcon,
  BookOpenIcon,
  MessageSquareIcon,
  FlameIcon,
  TrendingUpIcon,
  BarChart3Icon,
  BrainIcon,
  Users,
  Trophy,
  Crown,
  Star,
  Award,
  Medal
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Update the types section
type TrainingLogWithComments = TrainingLog & {
  comments: (Comment & { user: User })[];
  user: User;
};

type Comment = {
  id: number;
  content: string;
};

type User = {
  id: number;
  username: string;
  beltRank: string;
};

type PointsSummary = {
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  recentTransactions: PointTransaction[];
  achievements: UserAchievement[];
};

type PointTransaction = {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
};

type UserAchievement = {
  achievement: {
    name: string;
    description: string;
    icon: string;
  };
  earnedAt: string;
};


// Belt ranks and their corresponding colors
const BELT_COLORS = {
  white: "#FFFFFF",
  blue: "#0066CC",
  purple: "#660099",
  brown: "#8B4513",
  black: "#000000"
};

const CHART_COLORS = ["#0066CC", "#660099", "#8B4513", "#FF4444", "#00CC99"];

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const form = useForm({
    resolver: zodResolver(insertTrainingLogSchema),
    defaultValues: {
      type: "",
      duration: 60, // Set a reasonable default
      notes: "",
      techniques: []
    }
  });

  const { data: trainingLogs } = useQuery<TrainingLogWithComments[]>({
    queryKey: ["/api/training-logs"]
  });

  const { data: suggestions } = useQuery({
    queryKey: ["/api/suggestions"]
  });

  const { data: pointsSummary } = useQuery<PointsSummary>({
    queryKey: ["/api/points/summary"]
  });

  // Mutations remain unchanged
  const createLogMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting data:", data); // Add logging
      const payload = {
        ...data,
        duration: parseInt(data.duration),
        techniques: data.techniques || []
      };
      const res = await apiRequest("POST", "/api/training-logs", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-logs"] });
      form.reset();
      setShowTrainingForm(false);
    },
    onError: (error: Error) => {
      console.error("Form submission error:", error);
      // You might want to show a toast notification here
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ logId, content }: { logId: number, content: string }) => {
      const res = await apiRequest("POST", `/api/training-logs/${logId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-logs"] });
    }
  });

  const handleCommentSubmit = (logId: number, input: HTMLInputElement) => {
    const content = input.value;
    if (content.trim()) {
      createCommentMutation.mutate({
        logId,
        content
      });
      input.value = '';
    }
  };

  // Calculate statistics
  const totalTime = trainingLogs?.reduce((acc, log) => acc + log.duration, 0) || 0;
  const totalSessions = trainingLogs?.length || 0;
  const avgSessionTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

  // Prepare chart data
  const last7DaysData = trainingLogs
    ?.slice(0, 7)
    .map(log => ({
      date: new Date(log.date).toLocaleDateString(),
      duration: log.duration
    }))
    .reverse();

  // Calculate training type distribution
  const trainingTypeData = trainingLogs?.reduce((acc: { name: string, value: number }[], log) => {
    const existingType = acc.find(item => item.name === log.type);
    if (existingType) {
      existingType.value += 1;
    } else {
      acc.push({ name: log.type, value: 1 });
    }
    return acc;
  }, []) || [];

  // Calculate current streak
  const calculateStreak = () => {
    if (!trainingLogs?.length) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < trainingLogs.length; i++) {
      const logDate = new Date(trainingLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground">Belt Rank: {user?.beltRank}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/techniques">
              <Button variant="outline">
                <BookOpenIcon className="mr-2 h-4 w-4" />
                Technique Library
              </Button>
            </Link>
            <Link href="/community">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Community
              </Button>
            </Link>
            <Link href="/training-wizard">
              <Button variant="outline">
                <BrainIcon className="mr-2 h-4 w-4" />
                Training Wizard
              </Button>
            </Link>
            <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Training Streak Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <FlameIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateStreak()} days</div>
              <p className="text-xs text-muted-foreground">Keep training consistently!</p>
            </CardContent>
          </Card>

          {/* Total Training Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Training Time</CardTitle>
              <TimerIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTime} minutes</div>
              <p className="text-xs text-muted-foreground">
                Across {totalSessions} sessions
              </p>
            </CardContent>
          </Card>

          {/* Average Session Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Session</CardTitle>
              <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSessionTime} minutes</div>
              <p className="text-xs text-muted-foreground">
                Per training session
              </p>
            </CardContent>
          </Card>

          {/* Points and Level Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level {pointsSummary?.level}</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pointsSummary?.totalPoints.toLocaleString()} points</div>
              <div className="mt-4 space-y-2">
                <div className="text-xs text-muted-foreground">
                  Next level at {pointsSummary?.nextLevelPoints.toLocaleString()} points
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${((pointsSummary?.totalPoints || 0) / (pointsSummary?.nextLevelPoints || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Progress Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Training Progress</CardTitle>
              <CardDescription>Your training duration over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7DaysData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Training Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Training Types</CardTitle>
              <CardDescription>Distribution of your training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trainingTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {trainingTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Point Transactions */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest point earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pointsSummary?.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/10"
                >
                  <div className="flex items-center gap-2">
                    {transaction.type === 'training' && <Medal className="h-4 w-4 text-blue-500" />}
                    {transaction.type === 'streak' && <Star className="h-4 w-4 text-yellow-500" />}
                    {transaction.type === 'achievement' && <Award className="h-4 w-4 text-purple-500" />}
                    {transaction.type === 'social' && <Users className="h-4 w-4 text-green-500" />}
                    <span className="text-sm">{transaction.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      +{transaction.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>AI Training Insights</CardTitle>
              <CardDescription>Personalized suggestions based on your progress</CardDescription>
            </div>
            <BrainIcon className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Focus Areas</h3>
                {suggestions?.focusAreas?.map((area: string, i: number) => (
                  <div key={i} className="text-sm p-2 bg-primary/5 rounded-md">{area}</div>
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Suggested Techniques</h3>
                {suggestions?.suggestedTechniques?.map((tech: string, i: number) => (
                  <div key={i} className="text-sm p-2 bg-primary/5 rounded-md">{tech}</div>
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Training Tips</h3>
                {suggestions?.trainingTips?.map((tip: string, i: number) => (
                  <div key={i} className="text-sm p-2 bg-primary/5 rounded-md">{tip}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Following Activity */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Following Activity</CardTitle>
              <CardDescription>Recent training logs from practitioners you follow</CardDescription>
            </div>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingLogs?.filter(log => log.userId !== user?.id).map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border">
                  <Avatar>
                    <AvatarFallback>
                      {log.user?.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{log.user?.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.user?.beltRank} Belt
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2">{log.type} - {log.duration} minutes</p>
                    {log.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">{log.notes}</p>
                    )}
                    <div className="mt-4">
                      <Button variant="ghost" size="sm" className="h-8">
                        <MessageSquareIcon className="mr-2 h-4 w-4" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Achievements Showcase */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Your earned badges and accomplishments</CardDescription>
              </div>
              <Crown className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pointsSummary?.achievements.map((achievement) => (
                <div
                  key={achievement.achievement.name}
                  className="p-4 rounded-lg border bg-card text-card-foreground"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{achievement.achievement.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {achievement.achievement.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          className="mb-8 w-full"
          onClick={() => setShowTrainingForm(!showTrainingForm)}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {showTrainingForm ? "Cancel" : "Log New Training Session"}
        </Button>

        {/* Training Form */}
        {showTrainingForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Log Training Session</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createLogMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Gi, No-Gi, Open Mat" required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            min="1"
                            max="480"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createLogMutation.isPending}>
                    {createLogMutation.isPending ? "Saving..." : "Log Session"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Recent Training Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Training Sessions</CardTitle>
              <CardDescription>Your latest training activity</CardDescription>
            </div>
            <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingLogs?.slice(0, 5).map((log) => (
                <div key={log.id} className="border p-4 rounded-lg space-y-4">
                  <div>
                    <div className="flex justify-between">
                      <h3 className="font-semibold">{log.type}</h3>
                      <span className="text-muted-foreground">
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{log.notes}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Duration: {log.duration} minutes
                    </p>
                  </div>

                  {/* Comments Section */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Comments</h4>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a comment..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCommentSubmit(log.id, e.currentTarget);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            handleCommentSubmit(log.id, input);
                          }}
                        >
                          Comment
                        </Button>
                      </div>
                      {log.comments?.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2 text-sm">
                          <span className="font-medium">{comment.user.username}:</span>
                          <p>{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}