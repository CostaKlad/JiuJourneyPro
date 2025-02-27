import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, forgotPasswordSchema, resetPasswordSchema, type InsertUser, type ForgotPassword } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Redirect, useLocation } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const { user, loginMutation, registerMutation, forgotPasswordMutation } = useAuth();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.has("token") ? "reset" : "login";
  });

  // Fetch total user count
  const { data: userCount } = useQuery({
    queryKey: ["/api/users/count"],
    queryFn: async () => {
      console.log("Fetching user count...");
      const response = await apiRequest("GET", "/api/users/count");
      const data = await response.json();
      console.log("User count data:", data);
      return data;
    }
  });

  const loginForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema.pick({ username: true, password: true })),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      beltRank: "White" 
    }
  });

  const forgotPasswordForm = useForm<ForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const passwordRequirements = [
    "At least 8 characters long",
    "Must contain at least one uppercase letter",
    "Must contain at least one lowercase letter",
    "Must contain at least one number",
    "Must contain at least one special character"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center">
          <div className="text-center md:text-left mb-8">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <img 
                src="/logo.webp" 
                alt="OssRyu Logo" 
                className="h-12 w-12 object-contain"
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                OssRyu
              </h1>
            </div>

            {/* User Count Display */}
            {userCount && (
              <div className="bg-primary/10 p-4 rounded-lg mb-8 mt-2">
                <h2 className="text-2xl font-bold text-primary">
                  {userCount.total.toLocaleString()}
                </h2>
                <p className="text-lg font-medium">
                  Active BJJ Practitioners
                </p>
                <p className="text-sm text-muted-foreground">
                  Training and tracking progress together
                </p>
              </div>
            )}

            <p className="text-muted-foreground text-lg">
              Your digital companion for mastering Brazilian Jiu-Jitsu. Track progress, learn techniques, and connect with the community.
            </p>
          </div>

          <TooltipProvider>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
                <TabsTrigger value="forgot">Reset Password</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Continue your BJJ journey with OssRyu
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(data => loginMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                          {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="w-full"
                          onClick={() => setActiveTab("forgot")}
                        >
                          Forgot your password?
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Start Your Journey</CardTitle>
                    <CardDescription>
                      Join our BJJ community and track your progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(data => registerMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Choose a Username</FormLabel>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <FormControl>
                                    <Input placeholder="Pick a unique username" {...field} />
                                  </FormControl>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This will be your identity in the community</p>
                                </TooltipContent>
                              </Tooltip>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Create a Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Choose a secure password" {...field} />
                              </FormControl>
                              <FormMessage />
                              <Alert>
                                <AlertDescription>
                                  <ul className="list-disc pl-4 text-sm text-muted-foreground">
                                    {passwordRequirements.map((req, index) => (
                                      <li key={index}>{req}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="beltRank"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Belt Rank</FormLabel>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., White, Blue, Purple" />
                                  </FormControl>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This helps us personalize your experience</p>
                                </TooltipContent>
                              </Tooltip>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                          {registerMutation.isPending ? "Creating your account..." : "Start Training"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="forgot">
                <Card>
                  <CardHeader>
                    <CardTitle>Reset Your Password</CardTitle>
                    <CardDescription>
                      Enter your email to receive a password reset link
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...forgotPasswordForm}>
                      <form onSubmit={forgotPasswordForm.handleSubmit(data => forgotPasswordMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={forgotPasswordForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your registered email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
                          {forgotPasswordMutation.isPending ? "Sending reset link..." : "Send Reset Link"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </div>

        <div className="hidden md:flex flex-col justify-center items-center p-8 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-lg">
          <div className="max-w-md text-center space-y-8">
            <h2 className="text-3xl font-bold">Transform Your BJJ Journey</h2>
            <ul className="space-y-6 text-lg text-muted-foreground">
              <li className="flex items-center gap-4">
                <span className="bg-primary/10 p-3 rounded-full">📊</span>
                <span>Track your progress and achievements</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="bg-primary/10 p-3 rounded-full">🤼</span>
                <span>Connect with training partners</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="bg-primary/10 p-3 rounded-full">📚</span>
                <span>Access technique library and guides</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="bg-primary/10 p-3 rounded-full">🏆</span>
                <span>Earn achievements as you progress</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}