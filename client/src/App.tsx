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
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import UserProfile from "@/pages/user-profile";
import AchievementsDashboard from "@/pages/achievements-dashboard";
import TechniquePassport from "@/pages/technique-passport";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TrainingWizard from "@/pages/training-wizard";


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
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4">
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
                  <TooltipProvider>
                    <nav className="space-y-2">
                      {menuItems.map((item) => (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <Link href={item.href}>
                              <a className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location === item.href ? "bg-primary/10" : "hover:bg-primary/10"}`}>
                                <item.icon className="h-5 w-5" />
                                {item.label}
                              </a>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </nav>
                  </TooltipProvider>

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

            {/* Logo */}
            <Link href="/">
              <a className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-bold">
                OssRyu
              </a>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <TooltipProvider>
            <nav className="hidden lg:flex items-center gap-6">
              {menuItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <a className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        location === item.href ? "bg-primary/10" : "hover:bg-primary/10"
                      }`}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </a>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </TooltipProvider>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden lg:flex gap-2">
              <Plus className="h-4 w-4" />
              Log Training
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                  <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 focus:text-red-500"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <ProtectedRoute path="/wizard" component={TrainingWizard} />
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