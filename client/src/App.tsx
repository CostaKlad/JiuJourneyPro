import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TechniqueLibrary from "@/pages/technique-library";
import CommunityPage from "@/pages/community-page";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import {
  Menu,
  Home,
  BookMarked,
  Trophy,
  Users,
  Settings,
  LogOut,
  Plus,
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import UserProfile from "@/pages/user-profile";
import AchievementsDashboard from "@/pages/achievements-dashboard"; // Add this line

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
        <pre className="text-sm bg-red-50 p-4 rounded overflow-auto">
          {error.message}
        </pre>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader className="pb-6">
                <SheetTitle>
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      Ossify
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6">
                {/* User Profile Section */}
                <div className="flex items-center gap-4 pb-6 border-b">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{user?.username}</div>
                    <div className="text-sm text-muted-foreground">{user?.beltRank} Belt</div>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2">
                  <Link href="/">
                    <a className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location === "/" ? "bg-primary/10" : "hover:bg-primary/10"}`}>
                      <Home className="h-5 w-5" />
                      Dashboard
                    </a>
                  </Link>
                  <Link href="/techniques">
                    <a className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location === "/techniques" ? "bg-primary/10" : "hover:bg-primary/10"}`}>
                      <BookMarked className="h-5 w-5" />
                      Technique Library
                    </a>
                  </Link>
                  <Link href="/community">
                    <a className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location === "/community" ? "bg-primary/10" : "hover:bg-primary/10"}`}>
                      <Users className="h-5 w-5" />
                      Community
                    </a>
                  </Link>
                  <Link href="/achievements">
                    <a className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location === "/achievements" ? "bg-primary/10" : "hover:bg-primary/10"}`}>
                      <Trophy className="h-5 w-5" />
                      Achievements
                    </a>
                  </Link>
                </nav>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="px-4 text-sm font-medium">Quick Actions</h4>
                  <Button className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Log Training
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Target className="h-4 w-4" />
                    Find Partners
                  </Button>
                </div>

                {/* Settings & Logout */}
                <div className="space-y-2 mt-auto">
                  <Link href="/settings">
                    <a className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
                      <Settings className="h-5 w-5" />
                      Settings
                    </a>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 px-4">
            <div className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-bold">
              Ossify
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Layout>
            <Switch>
              <Route path="/auth" component={AuthPage} />
              <ProtectedRoute path="/" component={HomePage} />
              <ProtectedRoute path="/techniques" component={TechniqueLibrary} />
              <ProtectedRoute path="/community" component={CommunityPage} />
              <ProtectedRoute path="/users/:id" component={UserProfile} />
              <ProtectedRoute path="/achievements" component={AchievementsDashboard} /> {/* Add this line */}
              <Route component={NotFound} />
            </Switch>
          </Layout>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;