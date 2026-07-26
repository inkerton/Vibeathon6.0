"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";

import Vortex from "@/components/ui/dotted-bg";
import { useAuth } from "@/lib/auth-context";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";

    window.location.href = `${apiUrl}/api/v1/auth/google`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Vortex />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md rounded-2xl border border-white/20 bg-white shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4">
            <Image
              src="/next.svg"
              alt="Restaurant Logo"
              width={70}
              height={35}
              priority
            />

            <div>
              <CardTitle className="text-4xl font-bold tracking-tight">
                Welcome Back
              </CardTitle>

              <CardDescription className="mt-2 text-base text-muted-foreground">
                Sign in to continue to your account.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="h-12 rounded-lg px-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>

                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 rounded-lg px-4"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-lg bg-black text-base font-semibold hover:bg-neutral-800"
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>

                <div className="relative flex justify-center text-sm">
                  <span className="bg-white/80 px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="h-12 w-full rounded-lg border-gray-300 bg-white/80 text-base font-medium backdrop-blur-sm hover:bg-white"
              >
                <FcGoogle className="mr-3 h-5 w-5" />
                Continue with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-semibold text-primary hover:underline underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}