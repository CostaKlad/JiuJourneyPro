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

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const form = useForm({
    resolver: zodResolver(insertTrainingLogSchema),
    defaultValues: {
      type: "",
      duration: 0,
      notes: "",
      techniques: [] // Default empty array for techniques
    }
  });

  const { data: trainingLogs } = useQuery<TrainingLog[]>({
    queryKey: ["/api/training-logs"]
  });

  const { data: suggestions } = useQuery({
    queryKey: ["/api/suggestions"]
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure duration is a number
      const payload = {
        ...data,
        duration: parseInt(data.duration),
        techniques: data.techniques || [] // Ensure techniques is always an array
      };
      const res = await apiRequest("POST", "/api/training-logs", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-logs"] });
      form.reset();
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.username}</h1>
            <p className="text-muted-foreground">Belt Rank: {user?.beltRank}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/techniques">
              <Button variant="outline">Technique Library</Button>
            </Link>
            <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>AI Training Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Focus Areas</h3>
                    <ul className="list-disc pl-4">
                      {suggestions.focusAreas?.map((area: string, i: number) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Suggested Techniques</h3>
                    <ul className="list-disc pl-4">
                      {suggestions.suggestedTechniques?.map((tech: string, i: number) => (
                        <li key={i}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Training Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingLogs?.map((log) => (
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
                                const content = e.currentTarget.value;
                                if (content.trim()) {
                                  createCommentMutation.mutate({
                                    logId: log.id,
                                    content
                                  });
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              const content = input.value;
                              if (content.trim()) {
                                createCommentMutation.mutate({
                                  logId: log.id,
                                  content
                                });
                                input.value = '';
                              }
                            }}
                          >
                            Comment
                          </Button>
                        </div>
                        {log.comments?.map((comment: any) => (
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
    </div>
  );
}