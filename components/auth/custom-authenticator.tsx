import { useState } from "react";
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AuthState = "signIn" | "signUp" | "confirmSignUp" | "forgotPassword" | "confirmForgotPassword";

interface CustomAuthenticatorProps {
  children: React.ReactNode;
  onAuthSuccess?: () => void;
}

export function CustomAuthenticator({ children, onAuthSuccess }: CustomAuthenticatorProps) {
  const [authState, setAuthState] = useState<AuthState>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ username: email, password });
      onAuthSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      setAuthState("confirmSignUp");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode });
      setAuthState("signIn");
      setConfirmationCode("");
    } catch (err: any) {
      setError(err.message || "Failed to confirm sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword({ username: email });
      setAuthState("confirmForgotPassword");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode,
        newPassword: password,
      });
      setAuthState("signIn");
      setConfirmationCode("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {authState === "signIn" && "Sign in to tiny toast"}
            {authState === "signUp" && "Create an account"}
            {authState === "confirmSignUp" && "Confirm your email"}
            {authState === "forgotPassword" && "Reset password"}
            {authState === "confirmForgotPassword" && "Set new password"}
          </CardTitle>
          <CardDescription>
            {authState === "signIn" && "Enter your email and password to sign in"}
            {authState === "signUp" && "Enter your details to create a new account"}
            {authState === "confirmSignUp" && "Enter the confirmation code sent to your email"}
            {authState === "forgotPassword" && "Enter your email to receive a reset code"}
            {authState === "confirmForgotPassword" && "Enter the code and your new password"}
          </CardDescription>
        </CardHeader>

        {authState === "signIn" && (
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setAuthState("forgotPassword")}
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthState("signUp")}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </div>
            </CardFooter>
          </form>
        )}

        {authState === "signUp" && (
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthState("signIn")}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </form>
        )}

        {authState === "confirmSignUp" && (
          <form onSubmit={handleConfirmSignUp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Confirmation Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Confirming..." : "Confirm"}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setAuthState("signIn")}
                  className="text-primary hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </CardFooter>
          </form>
        )}

        {authState === "forgotPassword" && (
          <form onSubmit={handleForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending code..." : "Send reset code"}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setAuthState("signIn")}
                  className="text-primary hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </CardFooter>
          </form>
        )}

        {authState === "confirmForgotPassword" && (
          <form onSubmit={handleConfirmForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Confirmation Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code from email"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting password..." : "Reset password"}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setAuthState("signIn")}
                  className="text-primary hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
