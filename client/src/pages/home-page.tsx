import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { TrainingLog, insertTrainingLogSchema, TrainingType, FocusArea } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
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
  Medal,
  X,
  Shield,
  BookOpen,
  Flame
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
import { formatDistanceToNow } from 'date-fns';
import {cn} from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Target } from "lucide-react";


type UserAchievement = {
  id: number;
  name: string;
  description: string;
  icon: string;
  tier: string;
  progressMax: number;
  category: string;
  currentProgress: number;
  progressPercentage: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

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

type TrainingSuggestions = {
  focusAreas: string[];
  suggestedTechniques: string[];
  trainingTips: string[];
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

const BELT_COLORS = {
  white: "#FFFFFF",
  blue: "#0066CC",
  purple: "#660099",
  brown: "#8B4513",
  black: "#000000"
};

const CHART_COLORS = ["#0066CC", "#660099", "#8B4513", "#FF4444", "#00CC99"];

// Assume BJJTechniques is defined elsewhere and contains the technique data
const BJJTechniques = {
  SUBMISSIONS: ["Armbar", "Triangle Choke", "Rear Naked Choke", "Kimura"],
  POSITIONS_AND_SWEEPS: ["Guard", "Mount", "Side Control", "Sweep"],
  ESCAPES: ["Escape from Mount", "Escape from Side Control", "Escape from Guard"]
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

  const { data: achievementsProgress } = useQuery<UserAchievement[]>({
    queryKey: ["/api/achievements/progress"]
  });

  const { data: pointsSummary } = useQuery<PointsSummary>({
    queryKey: ["/api/points/summary"]
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting data:", data);
      const payload = {
        ...data,
        duration: parseInt(data.duration),
        techniques: data.techniquesPracticed || []
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

  function getTierColor(tier: string) {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'bg-orange-100 text-orange-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'diamond':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function groupBy<T>(arr: T[], fn: (item: T) => any) {
    return arr?.reduce<Record<string, T[]>>((prev, curr) => {
      const groupKey = fn(curr);
      const group = prev[groupKey] || [];
      return { ...prev, [groupKey]: [...group, curr] };
    }, {}) || {};
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
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

        {/* Move Log Training Button to Top */}
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
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="assessment">Assessment</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6">
                      <div className="text-sm text-muted-foreground mb-4">
                        Fill in the basic information about your training session.
                      </div>
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Training Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
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
                            <FormDescription>
                              Enter the name of the gym or location where you trained
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="details" className="space-y-6">
                      <div className="text-sm text-muted-foreground mb-4">
                        Record the techniques you practiced and your rolling performance.
                      </div>
                      <FormField
                        control={form.control}
                        name="techniquesPracticed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Techniques Practiced</FormLabel>
                            <FormDescription>
                              Select all the techniques you worked on during this session
                            </FormDescription>
                            <FormControl>
                              <Command className="rounded-lg border shadow-md">
                                <CommandInput placeholder="Search techniques..." />
                                <CommandList>
                                  <CommandEmpty>No techniques found.</CommandEmpty>
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
                                </CommandList>
                              </Command>
                            </FormControl>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {field.value.map((technique, index) => (
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          <div className="font-semibold text-sm">Submissions</div>
                          <FormField
                            control={form.control}
                            name="submissionsAttempted"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attempted</FormLabel>
                                <FormDescription>
                                  Select the submissions you attempted during rolling
                                </FormDescription>
                                <FormControl>
                                  <Command className="rounded-lg border shadow-md">
                                    <CommandInput placeholder="Search submissions..." />
                                    <CommandList>
                                      <CommandEmpty>No submissions found.</CommandEmpty>
                                      <CommandGroup>
                                        {BJJTechniques.SUBMISSIONS.map((submission) => (
                                          <CommandItem
                                            key={submission}
                                            onSelect={() => {
                                              if (!field.value?.includes(submission)) {
                                                field.onChange([...(field.value || []), submission]);
                                              }
                                            }}
                                          >
                                            {submission}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </FormControl>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {field.value?.map((submission, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      {submission}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                          const newSubmissions = [...field.value];
                                          newSubmissions.splice(index, 1);
                                          field.onChange(newSubmissions);
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
                            name="submissionsSuccessful"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Successful</FormLabel>
                                <FormDescription>
                                  Select the submissions you successfully executed
                                </FormDescription>
                                <FormControl>
                                  <Command className="rounded-lg border shadow-md">
                                    <CommandInput placeholder="Search successful submissions..." />
                                    <CommandList>
                                      <CommandEmpty>No submissions found.</CommandEmpty>
                                      <CommandGroup>
                                        {BJJTechniques.SUBMISSIONS.map((submission) => (
                                          <CommandItem
                                            key={submission}
                                            onSelect={() => {
                                              if (!field.value?.includes(submission)) {
                                                field.onChange([...(field.value || []), submission]);
                                              }
                                            }}
                                          >
                                            {submission}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </FormControl>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {field.value?.map((submission, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      {submission}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                          const newSubmissions = [...field.value];
                                          newSubmissions.splice(index, 1);
                                          field.onChange(newSubmissions);
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-6">
                          <div className="font-semibold text-sm">Escapes</div>
                          <FormField
                            control={form.control}
                            name="escapesAttempted"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attempted</FormLabel>
                                <FormDescription>
                                  Select the escapes you attempted during rolling
                                </FormDescription>
                                <FormControl>
                                  <Command className="rounded-lg border shadow-md">
                                    <CommandInput placeholder="Search escapes..." />
                                    <CommandList>
                                      <CommandEmpty>No escapes found.</CommandEmpty>
                                      <CommandGroup>
                                        {BJJTechniques.ESCAPES.map((escape) => (
                                          <CommandItem
                                            key={escape}
                                            onSelect={() => {
                                              if (!field.value?.includes(escape)) {
                                                field.onChange([...(field.value || []), escape]);
                                              }
                                            }}
                                          >
                                            {escape}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </FormControl>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {field.value?.map((escape, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      {escape}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                          const newEscapes = [...field.value];
                                          newEscapes.splice(index, 1);
                                          field.onChange(newEscapes);
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
                            name="escapesSuccessful"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Successful</FormLabel>
                                <FormDescription>
                                  Select the escapes you successfully executed
                                </FormDescription>
                                <FormControl>
                                  <Command className="rounded-lg border shadow-md">
                                    <CommandInput placeholder="Search successful escapes..." />
                                    <CommandList>
                                      <CommandEmpty>No escapes found.</CommandEmpty>
                                      <CommandGroup>
                                        {BJJTechniques.ESCAPES.map((escape) => (
                                          <CommandItem
                                            key={escape}
                                            onSelect={() => {
                                              if (!field.value?.includes(escape)) {
                                                field.onChange([...(field.value || []), escape]);
                                              }
                                            }}
                                          >
                                            {escape}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </FormControl>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {field.value?.map((escape, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      {escape}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                          const newEscapes = [...field.value];
                                          newEscapes.splice(index, 1);
                                          field.onChange(newEscapes);
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="assessment" className="space-y-6">
                      <div className="text-sm text-muted-foreground mb-4">
                        Rate your performance and energy levels during this session.
                      </div>
                      <FormField
                        control={form.control}
                        name="performanceRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Performance Rating</FormLabel>
                            <FormDescription>
                              How well do you think you performed today?
                            </FormDescription>
                            <FormControl>
                              <div className="space-y-2">
                                <Slider
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  className="py-4"
                                />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>Poor</span>
                                  <span>Average</span>
                                  <span>Excellent</span>
                                </div>
                              </div>
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
                            <FormLabel>Energy Level</FormLabel>
                            <FormDescription>
                              How was your energy level during training?
                            </FormDescription>
                            <FormControl>
                              <div className="space-y-2">
                                <Slider
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  className="py-4"
                                />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>Low</span>
                                  <span>Medium</span>
                                  <span>High</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="notes" className="space-y-6">
                      <div className="text-sm text-muted-foreground mb-4">
                        Add any additional notes or feedback about your training session.
                      </div>
                      <FormField
                        control={form.control}
                        name="rollingSummary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rolling Summary</FormLabel>
                            <FormDescription>
                              Describe how your rolling sessions went
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="What went well? What could be improved?"
                                className="min-h-[100px]"
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
                            <FormLabel>Personal Notes</FormLabel>
                            <FormDescription>
                              Any additional notes about your training
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="What would you like to remember about this session?"
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coachFeedback"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coach's Feedback</FormLabel>
                            <FormDescription>
                              Any feedback or tips from your coach
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="What did your coach suggest?"
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                  </Tabs>

                  <Button type="submit" disabled={createLogMutation.isPending}>
                    {createLogMutation.isPending ? "Saving..." : "Log Session"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Streak</CardTitle>
              <FlameIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateStreak()} days</div>
              <p className="text-xs text-muted-foreground">Keep the momentum going!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Submissions</CardTitle>
              <Medal className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trainingLogs?.reduce((acc, log) => acc + (log.submissionsSuccessful?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total successful submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Escapes</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trainingLogs?.reduce((acc, log) => acc + (log.escapesSuccessful?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total successful escapes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Techniques Practiced</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trainingLogs?.reduce((acc, log) => acc + (log.techniquesPracticed?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total techniques logged</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
              <CardDescription>Your training duration and performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
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

          <Card>
            <CardHeader>
              <CardTitle>Training Distribution</CardTitle>
              <CardDescription>Breakdown of your training types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trainingTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest training achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointsSummary?.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {transaction.type === 'submission' && <Target className="h-4 w-4 text-green-500" />}
                      {transaction.type === 'escape' && <Shield className="h-4 w-4 text-blue-500" />}
                      {transaction.type === 'technique' && <BookOpen className="h-4 w-4 text-purple-500" />}
                      {transaction.type === 'streak' && <Flame className="h-4 w-4 text-orange-500" />}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">+{transaction.amount} points</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Level Progress</CardTitle>
              <CardDescription>Your journey to the next level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">Level {pointsSummary?.level}</p>
                    <p className="text-sm text-muted-foreground">
                      {pointsSummary?.totalPoints.toLocaleString()} points
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {pointsSummary?.nextLevelPoints.toLocaleString() - pointsSummary?.totalPoints.toLocaleString()} points to next level
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${((pointsSummary?.totalPoints || 0) / (pointsSummary?.nextLevelPoints || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keep existing achievements section */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your earned badges and accomplishments</CardDescription>
            </div>
            <Crown className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupBy(achievementsProgress || [], a => a.category)).map(([category, achievements]) => (
                <div key={category} className="space-y-4">
                  <h3 className="font-semibold capitalize">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.name} className={cn(
                        "p-4 rounded-lg border bg-card text-card-foreground",
                        achievement.unlocked && "border-primary"
                      )}>
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-2 rounded-full",
                            achievement.unlocked ? "bg-primary/10" : "bg-muted"
                          )}>
                            <Award className={cn(
                              "h-6 w-6",
                              achievement.unlocked ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">
                                {achievement.name}
                              </h4>
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                getTierColor(achievement.tier)
                              )}>
                                {achievement.tier}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                            <div className="space-y-1">
                              <div className="h-2 rounded-full bg-secondary">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-300"
                                  style={{ width: `${achievement.progressPercentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                  {achievement.currentProgress} / {achievement.progressMax}
                                </span>
                                <span>{achievement.progressPercentage}%</span>
                              </div>
                            </div>
                            {achievement.unlocked && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Earned {formatDistanceToNow(new Date(achievement.unlockedAt!), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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

export default HomePage;