import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || res.statusText;
    } catch {
      errorMessage = await res.text() || res.statusText;
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Making ${method} request to ${url}`, data);
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",  // Important for session cookies
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = ({ on401 }: { on401: UnauthorizedBehavior }) => 
  async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    console.log(`Fetching data for queryKey:`, queryKey);
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",  // Important for session cookies
    });

    if (on401 === "returnNull" && res.status === 401) {
      console.log("Unauthorized request, returning null as configured");
      return null;
    }

    await throwIfResNotOk(res);

    try {
      return await res.json();
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      throw new Error("Invalid JSON response from server");
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: import.meta.env.DEV ? false : true,
      staleTime: 0,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
});