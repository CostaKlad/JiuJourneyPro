import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Target,
  Dumbbell,
  Brain,
  ScrollText,
  Trophy,
} from "lucide-react";

const wizardSchema = z.object({
  trainingFrequency: z.number().min(1).max(7),
  focusAreas: z.array(z.string()).min(1),
  goals: z.array(z.string()).min(1),
});

type WizardFormData = z.infer<typeof wizardSchema>;

const FOCUS_AREAS = [
  "Guard Work",
  "Submissions",
  "Takedowns",
  "Position Control",
  "Competition Preparation",
  "Self Defense",
];

const GOALS = [
  "Belt Promotion",
  "Competition Success",
  "Self Defense",
  "Technical Mastery",
  "Teaching Others",
  "Physical Fitness",
];

export default function TrainingWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [recommendations, setRecommendations] = useState<any>(null);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      trainingFrequency: 3,
      focusAreas: [],
      goals: [],
    },
  });

  const recommendationsMutation = useMutation({
    mutationFn: async (data: WizardFormData) => {
      const res = await apiRequest("POST", "/api/wizard/recommendations", data);
      return res.json();
    },
    onSuccess: (data) => {
      setRecommendations(data);
      setStep(4); // Move to results step
    },
  });

  const onSubmit = (data: WizardFormData) => {
    recommendationsMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Training Recommendation Wizard
          </h1>
          <p className="text-muted-foreground">
            Let's create your personalized training plan
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center ${
                s === step
                  ? "text-primary"
                  : s < step
                  ? "text-muted-foreground"
                  : "text-muted"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  s === step
                    ? "border-primary bg-primary/10"
                    : s < step
                    ? "border-muted-foreground bg-muted"
                    : "border-muted"
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 w-full ${
                    s < step ? "bg-muted-foreground" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Training Frequency</CardTitle>
                  <CardDescription>
                    How many days per week can you train?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="trainingFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={7}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Choose between 1-7 days per week
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Focus Areas</CardTitle>
                  <CardDescription>
                    What aspects of BJJ would you like to focus on?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="focusAreas"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-4">
                          {FOCUS_AREAS.map((area) => (
                            <FormField
                              key={area}
                              control={form.control}
                              name="focusAreas"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(area)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        const updated = checked
                                          ? [...current, area]
                                          : current.filter((a) => a !== area);
                                        field.onChange(updated);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {area}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Training Goals</CardTitle>
                  <CardDescription>
                    What are your primary training objectives?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="goals"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-4">
                          {GOALS.map((goal) => (
                            <FormField
                              key={goal}
                              control={form.control}
                              name="goals"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(goal)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        const updated = checked
                                          ? [...current, goal]
                                          : current.filter((g) => g !== goal);
                                        field.onChange(updated);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {goal}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {step === 4 && recommendations && (
              <div className="space-y-6">
                {/* Weekly Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Weekly Training Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {recommendations.weeklyPlan.map((day: any) => (
                        <div
                          key={day.day}
                          className="p-4 rounded-lg border bg-card"
                        >
                          <div className="font-semibold">{day.day}</div>
                          <div className="text-sm text-muted-foreground">
                            {day.focus} - {day.duration} minutes
                          </div>
                          <div className="mt-2 text-sm">
                            Techniques: {day.techniques.join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Focus Areas and Tips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.focusAreas.map((area: string) => (
                          <li
                            key={area}
                            className="flex items-center gap-2 text-sm"
                          >
                            <ChevronRight className="h-4 w-4" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Training Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.trainingTips.map((tip: string) => (
                          <li
                            key={tip}
                            className="flex items-center gap-2 text-sm"
                          >
                            <ChevronRight className="h-4 w-4" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Strength and Improvement Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Strength Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.strengthAreas.map((area: string) => (
                          <li
                            key={area}
                            className="flex items-center gap-2 text-sm"
                          >
                            <ChevronRight className="h-4 w-4" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.improvementAreas.map((area: string) => (
                          <li
                            key={area}
                            className="flex items-center gap-2 text-sm"
                          >
                            <ChevronRight className="h-4 w-4" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
              )}
              {step < 3 && (
                <Button
                  type="button"
                  className="ml-auto"
                  onClick={() => setStep(step + 1)}
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {step === 3 && (
                <Button
                  type="submit"
                  className="ml-auto"
                  disabled={recommendationsMutation.isPending}
                >
                  {recommendationsMutation.isPending
                    ? "Generating..."
                    : "Get Recommendations"}
                </Button>
              )}
              {step === 4 && (
                <Button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setRecommendations(null);
                    form.reset();
                  }}
                >
                  Start Over
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
