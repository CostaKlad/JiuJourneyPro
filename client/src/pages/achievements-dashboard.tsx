import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Target, Dumbbell } from "lucide-react";

// Simple metrics for tracking progress
interface TrainingMetric {
  id: number;
  name: string;
  current: number;
  target: number;
  category: 'TRAINING' | 'TECHNIQUES' | 'SUBMISSIONS';
}

function ProgressTracker() {
  const { data: metrics } = useQuery<TrainingMetric[]>({
    queryKey: ["/api/training/metrics"],
    staleTime: 1000 * 60,
  });

  const groupedMetrics = metrics?.reduce<Record<string, TrainingMetric[]>>((acc, metric) => {
    acc[metric.category] = acc[metric.category] || [];
    acc[metric.category].push(metric);
    return acc;
  }, {}) || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Training Progress
        </h1>
        <p className="text-muted-foreground">
          Track your BJJ training metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { category: 'TRAINING', icon: Dumbbell, title: 'Training Hours' },
          { category: 'TECHNIQUES', icon: Brain, title: 'Techniques Learned' },
          { category: 'SUBMISSIONS', icon: Target, title: 'Submissions Practiced' }
        ].map(({ category, icon: Icon, title }) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
              <CardDescription>Progress tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedMetrics[category]?.map((metric) => (
                <div key={metric.id} className="space-y-2">
                  <div className="text-sm font-medium">
                    {metric.name}
                  </div>
                  <Progress value={(metric.current / metric.target) * 100} />
                  <p className="text-xs text-right text-muted-foreground">
                    {metric.current} / {metric.target}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ProgressTracker;