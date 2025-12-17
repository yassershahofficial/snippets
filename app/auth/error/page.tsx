"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Configuration Error",
    description:
      "There is a problem with the server configuration. Please contact the administrator.",
  },
  AccessDenied: {
    title: "Access Denied",
    description:
      "You do not have permission to sign in. Please contact an administrator if you believe this is an error.",
  },
  Verification: {
    title: "Verification Error",
    description:
      "The verification token has expired or is invalid. Please try signing in again.",
  },
  Default: {
    title: "Authentication Error",
    description:
      "An error occurred during authentication. Please try again or contact support if the problem persists.",
  },
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";

  const errorInfo = errorMessages[error] || errorMessages.Default;

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
              className="flex justify-center"
            >
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold">{errorInfo.title}</CardTitle>
            <CardDescription className="mt-2">{errorInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/signin">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </motion.div>

            {error !== "Default" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-xs text-muted-foreground"
              >
                Error code: <code className="rounded bg-muted px-1 py-0.5">{error}</code>
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

