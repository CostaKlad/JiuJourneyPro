import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { TrainingLog, insertTrainingLogSchema, TrainingType, FocusArea } from "@shared/schema";
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
  TrendingUpIcon,
  Users,
  BrainIcon,
  X,
  Shield,
  BookOpen,
  Flame,
  Loader2,
  Target,
  MessageSquare,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area"

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

const BELT_COLORS = {
  white: "#FFFFFF",
  blue: "#0066CC",
  purple: "#660099",
  brown: "#8B4513",
  black: "#000000"
};

const CHART_COLORS = ["#0066CC", "#660099", "#8B4513", "#FF4444", "#00CC99"];

const BJJTechniques = {
  "POSITIONS_AND_SWEEPS": [
    "Armbar from Closed Guard",
    "Triangle Choke from Closed Guard",
    "Omoplata from Closed Guard",
    "Scissor Sweep",
    "Hip Bump Sweep",
    "Pendulum Sweep",
    "Balloon Sweep",
    "Sit-Up Guard Sweep",
    "Old School Sweep",
    "Lockdown to Electric Chair Sweep",
    "Deep Half Guard Sweep",
    "Spider Guard to Triangle",
    "Dela Riva Guard to Berimbolo",
    "X-Guard Sweep",
    "Half Guard Knee Shield Sweep",
    "Reverse De La Riva to Back Take",
    "Butterfly Guard Hook Sweep",
    "Sumi Gaeshi Sweep",
    "Shin to Shin Guard Sweep",
    "De La Riva to X-Guard Sweep",
    "Tripod Sweep"
  ],
  "SUBMISSIONS": [
    "Cross Collar Choke from Closed Guard",
    "Bow and Arrow Choke",
    "Loop Choke",
    "D'arce Choke",
    "Rear Naked Choke",
    "Kimura from Side Control",
    "Americana from Mount",
    "Armbar from Mount",
    "Straight Ankle Lock",
    "Heel Hook",
    "Kneebar",
    "North-South Choke",
    "Baseball Bat Choke",
    "Paper Cutter Choke",
    "Ezekiel Choke from Mount",
    "Arm Triangle Choke",
    "Peruvian Necktie",
    "Anaconda Choke",
    "Standing Guillotine Choke",
    "Clock Choke from Turtle"
  ],
  "ESCAPES": [
    "Bridge and Roll Escape",
    "Elbow Escape (Shrimping)",
    "Knee-to-Elbow Escape",
    "Frame and Hip Escape",
    "Bridge and Recover Guard",
    "Escape to Mount",
    "Escape to Turtle",
    "Leg Pummel to Side Control",
    "Reverse Kimura Trap",
    "Half Guard Underhook to Back Take",
    "Hip Heist Escape from Side Control",
    "Hip Bump Escape from Mount",
    "Underhook Knee Shield Escape",
    "Running Escape from Side Control",
    "Deep Half Escape from Side Control"
  ],
  "TAKEDOWNS": [
    "Ogoshi (Hip Throw)",
    "Seoi Nage (Shoulder Throw)",
    "Double Leg Takedown",
    "Single Leg Takedown",
    "Lapel Drag to Ankle Pick",
    "Head and Arm Throw",
    "Collar Drag Takedown",
    "Yoko Tomoe Nage",
    "Kouchi Gari (Inside Trip)",
    "Uchi Mata (Inner Thigh Throw)",
    "Harai Goshi (Sweeping Hip Throw)",
    "Osoto Gari (Outer Reap)"
  ]
};

const BELT_MILESTONES = {
  blue: { months: 12, label: "Blue Belt (avg. 1 year)" },
  purple: { months: 24, label: "Purple Belt (avg. 2 years)" },
  brown: { months: 42, label: "Brown Belt (avg. 3.5 years)" },
  black: { months: 60, label: "Black Belt (avg. 5 years)" }
};

const getBeltColor = (belt: string) => {
  switch (belt) {
    case "blue": return "#0066CC";
    case "purple": return "#660099";
    case "brown": return "#8B4513";
    case "black": return "#000000";
    default: return "#CCCCCC";
  }
};

type TrainingFormData = {
  type: typeof TrainingType[keyof typeof TrainingType];
  gym: string;
  techniquesPracticed: string[];
  rollingSummary: string;
  submissionsAttempted: string[];
  submissionsSuccessful: string[];
  escapesAttempted: string[];
  escapesSuccessful: string[];
  performanceRating: number;
  focusAreas: (typeof FocusArea)[keyof typeof FocusArea][];
  energyLevel: number;
  notes: string;
  coachFeedback: string;
  duration: number;
};

function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [showTrainingForm, setShowTrainingForm] = useState(false);

  const defaultValues: TrainingFormData = {
    type: TrainingType.GI,
    gym: "",
    techniquesPracticed: [],
    rollingSummary: "",
    submissionsAttempted: [],
    submissionsSuccessful: [],
    escapesAttempted: [],
    escapesSuccessful: [],
    performanceRating: 3,
    focusAreas: [],
    energyLevel: 3,
    notes: "",
    coachFeedback: "",
    duration: 60
  };

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(insertTrainingLogSchema),
    defaultValues
  });

  const { data: trainingLogs } = useQuery<TrainingLogWithComments[]>({
    queryKey: ["/api/training-logs"]
  });

  const { data: suggestions } = useQuery<TrainingSuggestions>({
    queryKey: ["/api/suggestions"]
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: TrainingFormData) => {
      const res = await apiRequest("POST", "/api/training-logs", {
        ...data,
        duration: Number(data.duration),
        techniquesPracticed: data.techniquesPracticed || [],
        focusAreas: data.focusAreas || [],
        submissionsAttempted: data.submissionsAttempted || [],
        submissionsSuccessful: data.submissionsSuccessful || [],
        escapesAttempted: data.escapesAttempted || [],
        escapesSuccessful: data.escapesSuccessful || []
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to save training log');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-logs"] });
      form.reset();
      setShowTrainingForm(false);
    },
    onError: (error: Error) => {
      console.error("Failed to log training session:", error);
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

  const totalTime = trainingLogs?.reduce((acc, log) => acc + log.duration, 0) || 0;
  const totalSessions = trainingLogs?.length || 0;
  const avgSessionTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

  const last7DaysData = trainingLogs
    ?.slice(0, 7)
    .map(log => ({
      date: new Date(log.date).toLocaleDateString(),
      duration: log.duration
    }))
    .reverse();

  const trainingTypeData = trainingLogs?.reduce((acc: { name: string, value: number }[], log) => {
    const existingType = acc.find(item => item.name === log.type);
    if (existingType) {
      existingType.value += 1;
    } else {
      acc.push({ name: log.type, value: 1 });
    }
    return acc;
  }, []) || [];

  function groupBy<T>(arr: T[] | undefined, fn: (item: T) => any) {
    if (!arr) return {};
    return arr.reduce<Record<string, T[]>>((prev, curr) => {
      const groupKey = fn(curr);
      const group = prev[groupKey] || [];
      return { ...prev, [groupKey]: [...group, curr] };
    }, {});
  }

  const groupedFocusAreas = groupBy(trainingLogs, (log) => log.focusAreas?.join(',') || '');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user?.username}
          </h1>
          <p className="text-muted-foreground">Belt Rank: {user?.beltRank}</p>
        </div>

        <Button
          className="w-full mb-8"
          size="lg"
          onClick={() => setShowTrainingForm(!showTrainingForm)}
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          {showTrainingForm ? "Cancel" : "Log New Training Session"}
        </Button>

        {showTrainingForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Log Training Session</CardTitle>
              <CardDescription>Record your training details and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createLogMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="font-semibold text-lg">Basic Information</div>
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Training Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select training type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={TrainingType.GI}>Gi Training</SelectItem>
                                <SelectItem value={TrainingType.NOGI}>No-Gi Training</SelectItem>
                                <SelectItem value={TrainingType.OPEN_MAT}>Open Mat</SelectItem>
                              </SelectContent>
                            </Select>
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
                              <div className="space-y-2">
                                <Slider
                                  min={30}
                                  max={180}
                                  step={15}
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  className="py-4"
                                />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>30 min</span>
                                  <span>{field.value} min</span>
                                  <span>180 min</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gym"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gym/Location</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Where did you train today?" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="energyLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Energy Level (1-5)</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                className="py-4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="font-semibold text-lg">Techniques & Performance</div>
                      <FormField
                        control={form.control}
                        name="techniquesPracticed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Techniques Practiced</FormLabel>
                            <FormControl>
                              <Command className="rounded-lg border shadow-md">
                                <CommandInput placeholder="Search techniques..." />
                                <CommandList className="max-h-[300px] overflow-y-auto">
                                  <CommandEmpty>No techniques found.</CommandEmpty>
                                  <CommandGroup heading="Positions & Sweeps">
                                    {BJJTechniques.POSITIONS_AND_SWEEPS.map((technique) => (
                                      <CommandItem
                                        key={technique}
                                        onSelect={() => {
                                          if (!field.value.includes(technique)) {
                                            field.onChange([...field.value, technique]);
                                          }
                                        }}
                                      >
                                        {technique}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  <CommandSeparator />
                                  <CommandGroup heading="Submissions">
                                    {BJJTechniques.SUBMISSIONS.map((technique) => (
                                      <CommandItem
                                        key={technique}
                                        onSelect={() => {
                                          if (!field.value.includes(technique)) {
                                            field.onChange([...field.value, technique]);
                                          }
                                        }}
                                      >
                                        {technique}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  <CommandSeparator />
                                  <CommandGroup heading="Escapes">
                                    {BJJTechniques.ESCAPES.map((technique) => (
                                      <CommandItem
                                        key={technique}
                                        onSelect={() => {
                                          if (!field.value.includes(technique)) {
                                            field.onChange([...field.value, technique]);
                                          }
                                        }}
                                      >
                                        {technique}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  <CommandSeparator />
                                  <CommandGroup heading="Takedowns">
                                    {BJJTechniques.TAKEDOWNS.map((technique) => (
                                      <CommandItem
                                        key={technique}
                                        onSelect={() => {
                                          if (!field.value.includes(technique)) {
                                            field.onChange([...field.value, technique]);
                                          }
                                        }}
                                      >
                                        {technique}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </FormControl>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {field.value && Array.isArray(field.value) && field.value.map((technique: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {technique}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => {
                                      const newTechniques = [...field.value];
                                      newTechniques.splice(index, 1);
                                      field.onChange(newTechniques);
                                    }}
                                  />
                                </Badge>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="performanceRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Performance Rating (1-5)</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                className="py-4"
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
                              <Textarea
                                {...field}
                                placeholder="Any additional notes about your training session..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTrainingForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createLogMutation.isPending}
                    >
                      {createLogMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Training Log'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Training Sessions</CardTitle>
                <BookOpenIcon className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSessions}</div>
                <p className="text-xs text-muted-foreground">Lifetime training sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Techniques Practiced</CardTitle>
                <BookOpen className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {trainingLogs && trainingLogs.length > 0 && (
                  <div className="text-2xl font-bold">
                    {trainingLogs.reduce((acc, log) => acc + (Array.isArray(log.techniquesPracticed) ? log.techniquesPracticed.length : 0), 0)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Total techniques logged</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trainingLogs && trainingLogs.length > 0
                    ? (trainingLogs.reduce((acc, log) => acc + (log.performanceRating || 0), 0) / trainingLogs.length).toFixed(1)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Average performance rating</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Energy</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trainingLogs && trainingLogs.length > 0
                    ? (trainingLogs.reduce((acc, log) => acc + (log.energyLevel || 0), 0) / trainingLogs.length).toFixed(1)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Average energy level</p>
              </CardContent>
            </Card>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
              <CardDescription>Your training duration compared to typical belt progression</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7DaysData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    {Object.entries(BELT_MILESTONES).map(([belt, { months, label }]) => (
                      <ReferenceLine
                        key={belt}
                        y={months * 30 * 2} // Approximate days of training
                        stroke={getBeltColor(belt)}
                        strokeDasharray="3 3"
                        label={{
                          value: label,
                          position: 'right',
                          fill: getBeltColor(belt),
                          fontSize: 12
                        }}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Milestone lines show typical progression timelines. Individual progress may vary based on training frequency and dedication.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Techniques</CardTitle>
              <CardDescription>Latest techniques you've practiced</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trainingLogs?.[0]?.techniquesPracticed?.map((technique, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="mr-2 mb-2"
                  >
                    {technique}
                  </Badge>
                )) || <p className="text-muted-foreground">No recent techniques</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Training Notes
            </CardTitle>
            <CardDescription>Quick access to your training notes and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search notes..."
                className="w-full max-w-sm mb-4"
                onChange={(e) => {
                  // Filter notes based on search input
                  const searchTerm = e.target.value.toLowerCase();
                  const filteredLogs = trainingLogs?.filter(log => 
                    log.notes?.toLowerCase().includes(searchTerm)
                  );
                }}
              />

              <ScrollArea className="h-[400px] md:h-[500px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {trainingLogs?.filter(log => log.notes)
                    .map((log, index) => (
                      <div
                        key={log.id}
                        className={cn(
                          "p-4 rounded-lg transition-colors",
                          index % 2 === 0 ? "bg-muted/50" : "bg-background"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium">
                              {new Date(log.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {log.type.toLowerCase()}
                              </Badge>
                              {log.performanceRating && (
                                <Badge variant="secondary">
                                  Performance: {log.performanceRating}/5
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {log.duration} min
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-muted-foreground">
                          {log.notes}
                        </div>

                        {log.techniquesPracticed && log.techniquesPracticed.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">
                              Techniques:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {log.techniquesPracticed.map((technique, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {technique}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default HomePage;