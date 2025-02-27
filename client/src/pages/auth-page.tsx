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
      password: "",
      email: ""
    }
  });

  const forgotPasswordForm = useForm<ForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const resetPasswordForm = useForm<InsertUser>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });


  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Fixed Position User Count Display */}
      {userCount && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-600/90 to-purple-600/90 p-6 rounded-lg shadow-xl border border-white/30 max-w-xs text-white">
          <h2 className="text-3xl font-bold text-center">
            {userCount.total.toLocaleString()}
          </h2>
          <p className="text-xl font-medium text-center">
            Active BJJ Practitioners
          </p>
          <p className="text-sm text-white/80 text-center mt-2">
            Training and tracking progress together
          </p>
        </div>
      )}

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

            <p className="text-muted-foreground text-lg">
              Your digital companion for mastering Brazilian Jiu-Jitsu. Track progress, learn techniques, and connect with the community.
            </p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
              {location.includes("forgot-password") && (
                <TabsTrigger value="forgot">Forgot Password</TabsTrigger>
              )}
              {location.includes("reset-password") && (
                <TabsTrigger value="reset">Reset Password</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}>
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Username" {...field} />
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
                              <Input type="password" placeholder="Password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Sign in</Button>
                    </form>
                    {loginMutation.isError && (
                      <Alert>
                        <AlertDescription>
                          {loginMutation.error?.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </Form>
                </CardContent>
              </Card>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>Forgot your password?</TooltipTrigger>
                    <TooltipContent>
                      <a href="/auth/forgot-password" className="underline">
                        Reset Password
                      </a>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </p>
            </TabsContent>
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>Create your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Register</Button>
                    </form>
                    {registerMutation.isError && (
                      <Alert>
                        <AlertDescription>
                          {registerMutation.error?.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="forgot">
              <Card>
                <CardHeader>
                  <CardTitle>Forgot Password</CardTitle>
                  <CardDescription>Reset your password</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit((data) => forgotPasswordMutation.mutate(data))}>
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Reset Password</Button>
                    </form>
                    {forgotPasswordMutation.isError && (
                      <Alert>
                        <AlertDescription>
                          {forgotPasswordMutation.error?.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reset">
              {/* Reset Password Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Reset Password</CardTitle>
                  <CardDescription>Choose a new password</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit((data) => {})} >
                      <FormField
                        control={resetPasswordForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="New Password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={resetPasswordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm Password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Reset Password</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div className="hidden md:flex items-center justify-center">
          {/* Image or other content for the second column */}
        </div>
      </div>
    </div>
  );
}