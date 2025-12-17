"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Chrome } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  useEffect(() => {
    // If already authenticated, redirect to admin
    if (isAuthenticated && !authLoading) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, authLoading, router, callbackUrl]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      const result = await signIn("google", {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to sign in. Please try again.");
        setIsSigningIn(false);
      } else if (result?.ok) {
        // Redirect will happen via useEffect when session updates
        router.push(callbackUrl);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <CardTitle className="text-3xl font-bold">Snippets CMS</CardTitle>
              <CardDescription className="mt-2">
                Sign in to access the admin dashboard
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleSignIn}
                disabled={isSigningIn || isAuthenticated}
                className="w-full"
                size="lg"
                variant="default"
              >
                {isSigningIn ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Chrome className="mr-2 h-5 w-5" />
                    Sign in with Google
                  </>
                )}
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-xs text-muted-foreground"
            >
              By signing in, you agree to access the admin dashboard
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

