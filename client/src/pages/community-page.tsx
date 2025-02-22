import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users, UserPlus, UserMinus, MessageSquare, ThumbsUp,
  Medal, Trophy, Star, Shield, BookOpen,
  Flame, Target, MapPin, Calendar, Clock, Dumbbell,
  Plus
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Basic test component to verify routing
function CommunityPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Community Page</h1>
      <p>Welcome, {user?.username}</p>
    </div>
  );
}

export default CommunityPage;