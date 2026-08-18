"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchApi } from "@/lib/api";

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await fetchApi<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, displayName, password }),
      });
      login(data.tokens, data.user);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
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
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
        placeholder="you@example.com"
      />

      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        disabled={loading}
        placeholder="johndoe"
        hint="This will be your unique handle (e.g. @johndoe)"
      />

      <Input
        label="Display Name"
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
        disabled={loading}
        placeholder="John Doe"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        placeholder="At least 8 characters"
        minLength={8}
      />

      <Button type="submit" variant="primary" className="mt-2" isLoading={loading}>
        Create account
      </Button>
    </form>
  );
}
