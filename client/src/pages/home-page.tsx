import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { TrainingLog, insertTrainingLogSchema } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlusIcon, TimerIcon, BookOpenIcon, MessageSquareIcon } from "lucide-react";

// Types remain unchanged
type TrainingLogWithComments = TrainingLog & {
  comments: (Comment & { user: User })[];
};

type Comment = {
  id: number;
  content: string;
};

type User = {
  username: string;
  beltRank?: string; // Added beltRank to handle potential undefined
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const form = useForm({
    resolver: zodResolver(insertTrainingLogSchema),
    defaultValues: {
      type: "",
      duration: 0,
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

  // Mutations remain unchanged
  const createLogMutation = useMutation({
    mutationFn: async (data: any) => {
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
            <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Session</CardTitle>
              <TimerIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSessionTime} minutes</div>
              <p className="text-xs text-muted-foreground">
                Per training session
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestions?.focusAreas?.slice(0, 2).map((area: string, i: number) => (
                  <div key={i} className="text-sm">{area}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

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
                          <Input {...field} placeholder="e.g., Gi, No-Gi" />
                        </FormControl>
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
                          <Input type="number" {...field} />
                        </FormControl>
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
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createLogMutation.isPending}>
                    Log Session
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Recent Training Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Training Sessions</CardTitle>
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