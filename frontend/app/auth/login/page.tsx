"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import DottedBg2 from "@/components/ui/dotted-bg";
import { useAuth } from "@/lib/auth-context";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction,
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
      {/* Animated Background */}
      <DottedBg2
        className="absolute inset-0"
        bgColor="#f8fafc"
        colors={["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4"]}
        frequency={3}
        speed={2}
        cellSize={28}
        gamma={6}
        paletteBias={-2}
      />

      {/* Soft overlay */}
      {/* <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px]" /> */}

      {/* Login Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-sm h-full space-y-12   ">
          <CardHeader>
            <div className="space-y-3 bg-red-200 flex flex-col gap-12 p-12">
              <div>
                <Image
                  src="/next.svg"
                  alt="Restaurant Logo"
                  width={70}
                  height={35}
                  priority
                  className="mb-20"
                />
              </div>
              <CardTitle className="mt-20 text-4xl sm:text-5xl font-bold tracking-tight">
                Sign in
              </CardTitle>

              <CardDescription className="text-base text-muted-foreground">
                Welcome back! Sign in to continue.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-12 bg-blue-200">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>

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
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>

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
                className="h-12 w-full rounded-lg text-base font-semibold"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="flex items-center gap-4 py-2">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="h-12 w-full rounded-lg text-base font-medium"
              >
                <FcGoogle className="mr-3 h-5 w-5" />
                Continue with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
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