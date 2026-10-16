"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// Enter the 6-digit code. Talks to Supabase from the browser: it starts a
// "challenge" for the admin's authenticator app and checks the code. On success
// the login becomes a two-step one and the team page opens.

function friendlyError(message: string, code?: string): string {
  if (code?.startsWith("over_") || /rate limit|too many/i.test(message)) {
    return "Too many tries. Please wait a minute and try again.";
  }
  if (/invalid|expired|incorrect/i.test(message) || code === "mfa_verification_failed") {
    return "That code is wrong or has expired. Codes change every 30 seconds, so type the one showing now.";
  }
  return "We could not check that code. Please try again.";
}

export function MfaChallenge() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Please type the 6 digits from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");

    const supabase = createClient();
    const factors = await supabase.auth.mfa.listFactors();
    const factor = factors.data?.totp?.[0];
    if (!factor) {
      setBusy(false);
      router.replace("/admin/security");
      return;
    }

    const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challenge.error || !challenge.data) {
      setBusy(false);
      setError(friendlyError(challenge.error?.message ?? "", challenge.error?.code));
      return;
    }

    const verified = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.data.id,
      code,
    });
    if (verified.error) {
      setBusy(false);
      setCode("");
      setError(friendlyError(verified.error.message, verified.error.code));
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          autoFocus
          className="text-center text-2xl font-bold tracking-[0.5em]"
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Checking\u2026" : "Verify and continue"}
      </Button>
    </form>
  );
}
