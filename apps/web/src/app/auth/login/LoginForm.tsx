"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchApi } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await fetchApi<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ emailOrUsername, password }),
      });
      login(data.tokens, data.user);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {error && (
        <div className="p-3 text-sm text-status-error bg-[var(--status-error)]/10 border border-[var(--status-error)]/20 rounded-lg">
          {error}
        </div>
      )}

      <Input
        label="Email or Username"
        type="text"
        value={emailOrUsername}
        onChange={(e) => setEmailOrUsername(e.target.value)}
        required
        disabled={loading}
        placeholder="Enter your email or username"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        placeholder="Enter your password"
      />

      <Button type="submit" variant="primary" className="mt-2" isLoading={loading}>
        Sign in
      </Button>
    </form>
  );
}
