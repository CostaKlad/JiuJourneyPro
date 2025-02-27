import { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CommunityPage from "@/pages/community-page";
import UserProfile from "@/pages/user-profile";
import AchievementsDashboard from "@/pages/achievements-dashboard";
import TrainingWizard from "@/pages/training-wizard";
import SettingsPage from "@/pages/settings-page";
import NotFound from "@/pages/not-found";
import TechniqueLibrary from "@/pages/technique-library";
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
  Brain,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg bg-destructive/10 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold">Something went wrong:</h2>
        <pre className="text-sm text-destructive">{error.message}</pre>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigate = () => setIsOpen(false);

  const menuItems = [
    { 
      href: "/", 
      icon: Home, 
      label: "Dashboard",
      description: "Overview of your training journey"
    },
    { 
      href: "/techniques", 
      icon: BookOpen, 
      label: "Techniques",
      description: "Learn and track BJJ techniques"
    },
    { 
      href: "/community", 
      icon: Users, 
      label: "Community",
      description: "Connect with fellow practitioners"
    },
    { 
      href: "/achievements", 
      icon: Trophy, 
      label: "Achievements",
      description: "Track your progress and milestones"
    },
    { 
      href: "/training-wizard", 
      icon: Brain, 
      label: "Training Wizard",
      description: "Get personalized training plans"
    }
  ];

  return (
    <div className={`min-h-screen bg-background transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden btn">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[300px] flex-col p-0">
                <SheetHeader className="border-b p-4">
                  <SheetTitle>
                    <Link href="/" onClick={handleNavigate} className="flex items-center gap-2">
                      <img src="/logo.webp" alt="OssRyu" className="h-8 w-8" />
                      <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                        OssRyu
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-auto">
                  <div className="flex flex-col gap-2 p-4">
                    {menuItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <a
                          onClick={handleNavigate}
                          className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                            location === item.href 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-muted"
                          }`}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <div>
                            <div className="font-medium">{item.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-t p-4">
                  <div className="mb-4 flex items-center gap-4">
                    <Avatar>
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.username || ''} />
                      ) : (
                        <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{user?.username}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {user?.beltRank} Belt
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Link href="/settings">
                      <a
                        onClick={handleNavigate}
                        className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </a>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-100/20"
                      onClick={() => {
                        handleNavigate();
                        logoutMutation.mutate();
                        window.location.href = "/auth";
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/">
              <a className="flex items-center gap-2 nav-link">
                <img src="/logo.webp" alt="OssRyu" className="h-8 w-8 transition-transform duration-200 hover:scale-110" />
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text font-bold text-transparent">
                  OssRyu
                </span>
              </a>
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex btn"
              onClick={() => window.location.href = '/training-wizard'}
            >
              <Plus className="mr-2 h-4 w-4" />
              Log Training
            </Button>
          </div>
        </div>
      </header>

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background/95 px-6 pb-4 backdrop-blur">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/">
              <a className="flex items-center gap-2">
                <img src="/logo.webp" alt="OssRyu" className="h-8 w-8" />
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                  OssRyu
                </span>
              </a>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                            location === item.href
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                          {item.label}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <Link href="/settings">
                  <a className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Settings className="h-6 w-6 shrink-0" />
                    Settings
                  </a>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full mt-2 justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-100/20"
                  onClick={() => {
                    logoutMutation.mutate();
                    window.location.href = "/auth";
                  }}
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <main className="lg:pl-72">
        <div className="container py-8">
          <div className={`page-transition ${mounted ? 'page-enter-active' : 'page-enter'}`}>
            {children}
          </div>
        </div>
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