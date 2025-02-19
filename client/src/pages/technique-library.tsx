import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Technique } from "@shared/schema";

export default function TechniqueLibrary() {
  const { data: techniques } = useQuery<Technique[]>({
    queryKey: ["/api/techniques"]
  });

  const categories = ["submissions", "positions", "escapes", "guards"];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Technique Library</h1>

        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="mb-8">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techniques
                  ?.filter((t) => t.category === category)
                  .map((technique) => (
                    <Card key={technique.id}>
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
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
