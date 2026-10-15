"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// Set up, check or remove the admin's authenticator app. Talks to Supabase from
// the browser. Nothing is switched on until the admin proves the app works by
// typing a code from it.

type Factor = { id: string; friendly_name?: string; created_at: string };
type Enrollment = { id: string; qr: string; secret: string };

function friendlyError(message: string, code?: string): string {
  if (code?.startsWith("over_") || /rate limit|too many/i.test(message)) {
    return "Too many tries. Please wait a minute and try again.";
  }
  if (/invalid|expired|incorrect/i.test(message) || code === "mfa_verification_failed") {
    return "That code is wrong or has expired. Codes change every 30 seconds, so type the one showing now.";
  }
  return "Something went wrong. Please try again.";
}

export function MfaSetup({ currentLevel, enforced }: { currentLevel: string; enforced: boolean }) {
  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const supabase = createClient();
    const { data, error: loadError } = await supabase.auth.mfa.listFactors();
    if (loadError) {
      setError("We could not load your two-step status. Please refresh the page.");
    } else {
      setFactor((data?.totp?.[0] as Factor | undefined) ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.mfa.listFactors()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) setError("We could not load your two-step status. Please refresh the page.");
        else setFactor((data?.totp?.[0] as Factor | undefined) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 1: ask Supabase for a new secret and a QR code to scan.
  async function startSetup() {
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createClient();

    // An earlier setup that was never finished would block a new one: clear it.
    const all = await supabase.auth.mfa.listFactors();
    for (const old of all.data?.all ?? []) {
      if (old.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: old.id });
    }

    const result = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `BahayFind admin ${Date.now()}`,
    });
    setBusy(false);
    if (result.error || !result.data) {
      setError(friendlyError(result.error?.message ?? "", result.error?.code));
      return;
    }
    setEnrollment({ id: result.data.id, qr: result.data.totp.qr_code, secret: result.data.totp.secret });
    setCode("");
  }

  // Step 2: the admin types a code from the app, which proves it is set up.
  async function confirmSetup(event: FormEvent) {
    event.preventDefault();
    if (!enrollment) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Please type the 6 digits from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createClient();

    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.id });
    if (challenge.error || !challenge.data) {
      setBusy(false);
      setError(friendlyError(challenge.error?.message ?? "", challenge.error?.code));
      return;
    }
    const verified = await supabase.auth.mfa.verify({
      factorId: enrollment.id,
      challengeId: challenge.data.id,
      code,
    });
    setBusy(false);
    if (verified.error) {
      setCode("");
      setError(friendlyError(verified.error.message, verified.error.code));
      return;
    }

    setEnrollment(null);
    setCode("");
    setNotice("Two-step verification is now on for your account.");
    await load();
  }

  async function cancelSetup() {
    if (enrollment) await createClient().auth.mfa.unenroll({ factorId: enrollment.id });
    setEnrollment(null);
    setCode("");
    setError("");
  }

  // Removing needs a code-verified session (Supabase's rule), so it is offered
  // only when the admin is signed in with a code.
  async function remove() {
    if (!factor) return;
    if (!window.confirm("Turn off two-step verification for your account? Your account will be protected by the password only.")) return;
    setBusy(true);
    setError("");
    const result = await createClient().auth.mfa.unenroll({ factorId: factor.id });
    setBusy(false);
    if (result.error) {
      setError("We could not turn it off. Log in with your code first, then try again.");
      return;
    }
    setNotice("Two-step verification was turned off.");
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading\u2026</p>;

  return (
    <div className="flex flex-col gap-5">
      {notice && (
        <p role="status" className="alert-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      {enrollment ? (
        <form onSubmit={confirmSetup} className="flex flex-col gap-5" noValidate>
          <ol className="list-decimal space-y-4 pl-5 text-[0.9375rem]">
            <li>
              Install an authenticator app on your phone (for example Google Authenticator, Microsoft Authenticator
              or Authy).
            </li>
            <li>
              In the app, add an account and scan this picture.
              <div className="mt-3 inline-block rounded-xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- a QR code made by Supabase, shown as a data address */}
                <img src={enrollment.qr} alt="QR code to scan with your authenticator app" width={176} height={176} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cannot scan it? Type this key into the app instead:{" "}
                <code className="break-all rounded bg-surface px-1.5 py-0.5 font-bold text-foreground">{enrollment.secret}</code>
              </p>
            </li>
            <li>Type the 6-digit code the app shows now.</li>
          </ol>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="setup-code">6-digit code</Label>
            <Input
              id="setup-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="max-w-[14rem] text-center text-2xl font-bold tracking-[0.5em]"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Checking\u2026" : "Turn on two-step verification"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={cancelSetup}>
              Cancel
            </Button>
          </div>
        </form>
      ) : factor ? (
        <div className="flex flex-col gap-4">
          <p className="alert-success">Two-step verification is ON for your account.</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
            <dt className="text-muted-foreground">This login</dt>
            <dd className="font-semibold">{currentLevel === "aal2" ? "Verified with a code" : "Password only so far"}</dd>
            <dt className="text-muted-foreground">Set up on</dt>
            <dd className="font-semibold">{new Date(factor.created_at).toLocaleDateString("en-PH", { dateStyle: "long" })}</dd>
            <dt className="text-muted-foreground">Required for the team page</dt>
            <dd className="font-semibold">{enforced ? "Yes" : "Not yet (the team has not switched it on)"}</dd>
          </dl>
          {currentLevel === "aal2" ? (
            <div>
              <Button type="button" variant="outline" disabled={busy} onClick={remove}>
                Turn off two-step verification
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              To change or turn it off, first log in with your code: open the team page and enter the code when asked.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[0.9375rem]">
            Two-step verification is <strong>off</strong>. Turn it on so that a stolen password alone cannot open the
            team page. You will need your phone each time you log in as an admin.
          </p>
          <div>
            <Button type="button" disabled={busy} onClick={startSetup}>
              {busy ? "Getting ready\u2026" : "Set up two-step verification"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
