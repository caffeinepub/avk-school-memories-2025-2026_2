import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Eye, EyeOff, LogIn, Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { actor } = useActor();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;

    setIsLoading(true);
    setError("");

    try {
      const token = await actor.adminLogin(adminId, password);
      localStorage.setItem("avk_admin_token", token);
      navigate({ to: "/admin/dashboard" });
    } catch {
      setError("Invalid credentials. Please check your Admin ID and password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 20% 30%, oklch(0.88 0.12 80 / 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, oklch(0.82 0.08 260 / 0.15) 0%, transparent 50%),
          linear-gradient(135deg, oklch(var(--cream)) 0%, oklch(var(--parchment)) 100%)
        `,
      }}
    >
      {/* Back to gallery */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-body"
        data-ocid="admin.link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Gallery
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "oklch(var(--navy))" }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">
            Admin Login
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-px bg-gold" />
            <Star className="w-3 h-3 text-gold fill-current" />
            <div className="w-8 h-px bg-gold" />
          </div>
          <p className="text-muted-foreground text-sm font-body">
            AVK School Memories 2025–2026
          </p>
        </div>

        {/* Login Card */}
        <div
          className="bg-card rounded-2xl shadow-lg border border-border p-8"
          style={{
            boxShadow:
              "0 4px 6px -1px oklch(0.22 0.09 264 / 0.08), 0 16px 48px -8px oklch(0.22 0.09 264 / 0.12)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Admin ID */}
            <div className="space-y-1.5">
              <Label
                htmlFor="adminId"
                className="font-body text-sm font-medium text-foreground"
              >
                Admin ID
              </Label>
              <Input
                id="adminId"
                data-ocid="login.input"
                type="text"
                placeholder="Enter your admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
                autoComplete="username"
                className="font-body bg-background border-input"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="font-body text-sm font-medium text-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  data-ocid="login.password_input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="font-body bg-background border-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                data-ocid="login.error_state"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-body"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <Button
              data-ocid="login.submit_button"
              type="submit"
              disabled={isLoading || !adminId || !password}
              className="w-full font-body font-semibold gap-2 h-11 text-primary-foreground"
              style={{ background: "oklch(var(--navy))" }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Login
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-6 font-body">
          Authorized personnel only. All access is monitored.
        </p>
      </motion.div>
    </div>
  );
}
