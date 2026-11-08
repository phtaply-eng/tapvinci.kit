"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    };
    check();
  }, [router]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "white" }}>
        <p>Checking sign-in...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "white", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#171717", border: "1px solid #333", borderRadius: 16, padding: 28, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>TapVinci</h1>
        <p style={{ color: "#a3a3a3", marginTop: 8, marginBottom: 24 }}>Sign in to edit your card</p>

        <p style={{ fontSize: 14, color: "#d4d4d4", lineHeight: 1.5, marginBottom: 20 }}>
          Use the same Google account that claimed your card.
          <br />
          For the student card, that is the account you used when you first tapped / claimed it.
        </p>

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 999, border: "none", background: "#facc15", color: "black", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Opening Google..." : "Sign in with Google →"}
        </button>

        {error && <p style={{ color: "#f87171", fontSize: 14, marginTop: 16 }}>{error}</p>}

        <p style={{ fontSize: 13, color: "#737373", marginTop: 20 }}>
          No account yet? Open your NFC card link <span style={{ color: "#e5e5e5" }}>/c/XXXXXXX</span> to claim a card first.
        </p>

        <a href="/" style={{ display: "inline-block", marginTop: 12, color: "#facc15", fontSize: 14, textDecoration: "none" }}>
          ← Back to home
        </a>
      </div>
    </main>
  );
}