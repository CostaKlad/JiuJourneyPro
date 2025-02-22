import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";

function CommunityPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-6">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Community Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Welcome, {user?.username || 'Guest'}</p>
          <p className="text-muted-foreground mt-2">This is the BJJ community hub</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CommunityPage;