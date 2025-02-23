import { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { TourProvider } from "@/hooks/use-tour";
import { TourGuide } from "@/components/ui/tour-guide";
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
  Target,
  Swords,
  User,
  Brain
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import UserProfile from "@/pages/user-profile";
import AchievementsDashboard from "@/pages/achievements-dashboard";
import TechniquePassport from "@/pages/technique-passport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TrainingWizard from "@/pages/training-wizard";

const menuItems = [
  { 
    href: "/", 
    icon: Home, 
    label: "Dashboard",
    tooltip: "View your training overview and recent activity"
  },
  { 
    href: "/techniques", 
    icon: BookMarked, 
    label: "Technique Library",
    tooltip: "Browse and learn BJJ techniques" 
  },
  { 
    href: "/passport", 
    icon: Swords, 
    label: "Technique Passport",
    tooltip: "Track your progress in different techniques" 
  },
  { 
    href: "/community", 
    icon: Users, 
    label: "Community",
    tooltip: "Connect with other practitioners" 
  },
  { 
    href: "/achievements", 
    icon: Trophy, 
    label: "Achievements",
    tooltip: "View your earned achievements and medals" 
  },
  { 
    href: "/training-wizard", 
    icon: Brain, 
    label: "Training Wizard",
    tooltip: "Get personalized training recommendations" 
  },
];

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
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (href: string) => {
    setIsOpen(false); // Close the sheet when navigating
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* Mobile Menu Button and Logo */}
          <div className="flex items-center gap-4 flex-1">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-80">
                <SheetHeader className="pb-6">
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        OssRyu
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
                    {menuItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <a 
                          onClick={() => handleNavigate(item.href)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            location === item.href ? "bg-primary/10" : "hover:bg-primary/10"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </a>
                      </Link>
                    ))}
                  </nav>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <h4 className="px-4 text-sm font-medium">Quick Actions</h4>
                    <Button className="w-full justify-start gap-2" onClick={() => setIsOpen(false)}>
                      <Plus className="h-4 w-4" />
                      Log Training
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsOpen(false)}>
                      <Target className="h-4 w-4" />
                      Find Partners
                    </Button>
                  </div>

                  {/* Settings & Logout */}
                  <div className="mt-auto space-y-2">
                    <Link href="/settings">
                      <a 
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        Settings
                      </a>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
                      onClick={() => {
                        setIsOpen(false);
                        logoutMutation.mutate();
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/">
              <a className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-bold">
                OssRyu
              </a>
            </Link>
          </div>

          {/* Profile Avatar */}
          <Avatar
            className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => setIsOpen(true)}
          >
            <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <main className="container mx-auto p-4">
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
          <TourProvider>
            <Layout>
              <Switch>
                <Route path="/auth" component={AuthPage} />
                <ProtectedRoute path="/" component={HomePage} />
                <ProtectedRoute path="/techniques" component={TechniqueLibrary} />
                <ProtectedRoute path="/passport" component={TechniquePassport} />
                <ProtectedRoute path="/community" component={CommunityPage} />
                <ProtectedRoute path="/users/:id" component={UserProfile} />
                <ProtectedRoute path="/achievements" component={AchievementsDashboard} />
                <ProtectedRoute path="/training-wizard" component={TrainingWizard} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
            <Toaster />
            <TourGuide />
          </TourProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;