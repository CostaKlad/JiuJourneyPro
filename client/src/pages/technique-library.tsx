
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Technique } from "@shared/schema";

const CATEGORIES = ["submissions", "positions", "escapes", "guards"] as const;

function TechniqueCard({ technique }: { technique: Technique }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{technique.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video mb-4">
          <iframe
            src={technique.videoUrl}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
        <p className="text-sm mb-2">{technique.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-primary/10 rounded-full">
            {technique.difficulty}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TechniqueLibrary() {
  const { data: techniques } = useQuery<Technique[]>({
    queryKey: ["/api/techniques"]
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Technique Library</h1>

        <Tabs defaultValue={CATEGORIES[0]} className="w-full">
          <TabsList className="mb-8">
            {CATEGORIES.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techniques
                  ?.filter((t) => t.category === category)
                  .map((technique) => (
                    <TechniqueCard key={technique.id} technique={technique} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
