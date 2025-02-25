import { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
// import { TourProvider } from "@/hooks/use-tour"; //Removed
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CommunityPage from "@/pages/community-page";
import UserProfile from "@/pages/user-profile";
import AchievementsDashboard from "@/pages/achievements-dashboard";
import TrainingWizard from "@/pages/training-wizard";
import SettingsPage from "@/pages/settings-page";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import {
  Menu,
  Home,
  Trophy,
  Users,
  Settings,
  LogOut,
  Plus,
  Target,
  Brain
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 md:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu - Always visible */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-80">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <img 
                        src="/logo.webp" 
                        alt="OssRyu Logo" 
                        className="h-8 w-8 object-contain"
                      />
                      <div className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        OssRyu
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* User Profile Section */}
                <div className="flex items-center gap-4 py-6 border-b">
                  <Avatar className="h-10 w-10">
                    {user?.avatarUrl ? (
                      <AvatarImage 
                        src={user.avatarUrl} 
                        alt={user.username || ''} 
                      />
                    ) : (
                      <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-semibold">{user?.username}</div>
                    <div className="text-sm text-muted-foreground">{user?.beltRank} Belt</div>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2 py-6">
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
                <div className="space-y-2 py-6 border-t">
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
                <div className="mt-auto space-y-2 border-t pt-6">
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
              </SheetContent>
            </Sheet>

            {/* Logo and Title */}
            <Link href="/">
              <a className="flex items-center gap-2">
                <img 
                  src="/logo.webp" 
                  alt="OssRyu Logo" 
                  className="h-8 w-8 object-contain"
                />
                <div className="flex items-center">
                  <span className="font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    OssRyu
                  </span>
                  <span className="text-sm font-medium bg-gradient-to-r from-primary/80 to-purple-500/80 bg-clip-text text-transparent ml-2 hidden md:inline">
                    Train. Track. Compete. Level Up.
                  </span>
                </div>
              </a>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 mobile-main-content">
        {children}
      </main>
    </div>
  );
}

const menuItems = [
  { 
    href: "/", 
    icon: Home, 
    label: "Dashboard",
    tooltip: "View your training overview and recent activity"
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

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Layout>
            <Switch>
              <Route path="/auth" component={AuthPage} />
              <ProtectedRoute path="/" component={HomePage} />
              <ProtectedRoute path="/community" component={CommunityPage} />
              <ProtectedRoute path="/users/:id" component={UserProfile} />
              <ProtectedRoute path="/achievements" component={AchievementsDashboard} />
              <ProtectedRoute path="/training-wizard" component={TrainingWizard} />
              <ProtectedRoute path="/settings" component={SettingsPage} />
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