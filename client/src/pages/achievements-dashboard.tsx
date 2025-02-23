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

interface ProgressMetric {
  id: number;
  name: string;
  description: string;
  current: number;
  target: number;
  category: string;
}

function ProgressDashboard() {
  const { data: metrics } = useQuery<ProgressMetric[]>({
    queryKey: ["/api/progress/metrics"],
    staleTime: 1000 * 60,
  });

  const groupedMetrics = metrics?.reduce<Record<string, ProgressMetric[]>>((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {}) || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Progress Tracking
        </h1>
        <p className="text-muted-foreground">
          Track your BJJ journey metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedMetrics).map(([category, metrics]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {category === 'TECHNIQUES' && <Brain className="h-5 w-5" />}
                {category === 'SUBMISSIONS' && <Target className="h-5 w-5" />}
                {category === 'TRAINING' && <Dumbbell className="h-5 w-5" />}
                <CardTitle className="text-lg capitalize">
                  {category.toLowerCase()}
                </CardTitle>
              </div>
              <CardDescription>Progress tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.map((metric) => (
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

export default ProgressDashboard;