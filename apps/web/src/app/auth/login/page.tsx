import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Seamlis account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-card border border-border rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-6 flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center">
              <span className="text-white font-extrabold font-display text-lg">S</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-display text-content-primary">
            Welcome back
          </h1>
          <p className="text-content-secondary mt-2 text-sm text-center">
            Sign in to continue to Seamlis
          </p>
        </div>

        <LoginForm />

        <div className="mt-8 pt-6 border-t border-border text-center text-sm">
          <p className="text-content-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-brand-primary hover:text-brand-secondary font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
