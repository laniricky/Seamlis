import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Join Seamlis and start sharing your videos",
};

export default function RegisterPage() {
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
            Create an account
          </h1>
          <p className="text-content-secondary mt-2 text-sm text-center">
            Join Seamlis and start sharing your story
          </p>
        </div>

        <RegisterForm />

        <div className="mt-8 pt-6 border-t border-border text-center text-sm">
          <p className="text-content-secondary">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-primary hover:text-brand-hover font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
