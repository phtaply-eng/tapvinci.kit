"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setUserEmail(user?.email ?? null);
      if (user) {
        // Find the profile owned by this Google account
        // FIX: profiles has NO claimed_by column. Owner link is in cards:
        // cards.claimed_by = user id, cards.profile_id = profiles.id
        let found: string | null = null;
        const card = await supabase
          .from("cards")
          .select("profile_id")
          .eq("claimed_by", user.id)
          .maybeSingle();
        if (card.data?.profile_id) {
          const prof = await supabase
            .from("profiles")
            .select("username")
            .eq("id", card.data.profile_id)
            .maybeSingle();
          if (prof.data?.username) found = prof.data.username;
        }
        if (!found) {
          // Fallback: profile id itself equals user id
          const byId = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();
          if (byId.data?.username) found = byId.data.username;
        }
        if (found) setMyUsername(found);
      }
      setChecking(false);
    };
    check();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    setMyUsername(null);
    setLoading(false);
  };

  const handleContinue = () => {
    if (myUsername) {
      router.push(`/dashboard?edit=${myUsername}`);
    } else {
      router.push("/dashboard");
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

        {userEmail ? (
          <>
            <p style={{ fontSize: 14, color: "#d4d4d4", lineHeight: 1.5, marginBottom: 6 }}>
              You are signed in as:
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#facc15", marginTop: 0, marginBottom: 8, wordBreak: "break-all" }}>
              {userEmail}
            </p>
            {myUsername && (
              <p style={{ fontSize: 13, color: "#a3a3a3", marginTop: 0, marginBottom: 20 }}>
                Your card: <span style={{ color: "#e5e5e5", fontWeight: 600 }}>{myUsername}</span>
              </p>
            )}
            {!myUsername && (
              <p style={{ fontSize: 13, color: "#a3a3a3", lineHeight: 1.5, marginBottom: 20 }}>
                To edit your card, you must be signed in as the Google account that claimed it.
              </p>
            )}
            <button
              onClick={handleContinue}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 999, border: "none", background: "#facc15", color: "black", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 12 }}
            >
              {myUsername ? `Continue to my card (${myUsername})` : "Continue to Dashboard"}
            </button>
            <button
              onClick={handleSignOut}
              disabled={loading}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 999, border: "1px solid #555", background: "transparent", color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing out..." : "Sign out and use a different account"}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "#d4d4d4", lineHeight: 1.5, marginBottom: 20 }}>
              Use the same Google account that claimed your card.
              <br />
              For your TapVinci card, that is the account you used when you first tapped / claimed it.
            </p>
            <button
              onClick={handleSignIn}
              disabled={loading}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 999, border: "none", background: "#facc15", color: "black", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Opening Google..." : "Sign in with Google"}
            </button>
          </>
        )}

        {error && <p style={{ color: "#f87171", fontSize: 14, marginTop: 16 }}>{error}</p>}

        <p style={{ fontSize: 13, color: "#737373", marginTop: 20 }}>
          No account yet? Open your NFC card link /c/XXXXXXX to claim a card first.
        </p>

        <a href="/" style={{ display: "inline-block", marginTop: 12, color: "#facc15", fontSize: 14, textDecoration: "none" }}>
          Back to home
        </a>
      </div>
    </main>
  );
}