import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const Auth = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[400px] border-border/50 glow-primary">
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl mb-2">🦀</div>
            <CardTitle className="text-2xl font-mono tracking-tight">
              TRENCHCLAW
            </CardTitle>
            <p className="text-sm text-muted-foreground font-mono">
              COMMAND CENTER
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="operator@trenchclaw.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border font-mono text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border font-mono text-sm"
                  required
                />
              </div>
              {error && (
                <p className="text-destructive text-sm font-mono">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full font-mono font-semibold tracking-wide"
                disabled={loading}
              >
                {loading ? "AUTHENTICATING..." : "ACCESS GRANTED →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
