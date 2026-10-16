import Link from "next/link";
import { redirect } from "next/navigation";
import { signup } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { SocialButtons } from "@/components/social-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { errorText } from "@/lib/messages";

// The two kinds of account. The values are what signup() in auth/actions.ts
// expects, so do not rename them. Admin can never be chosen here.
const ACCOUNT_TYPES = [
  { value: "student", title: "Student", hint: "Looking for a room" },
  { value: "owner", title: "Owner", hint: "Renting out rooms" },
];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // The address carries only a short code; the text comes from our own list.
  const error = errorText((await searchParams).error);

  // Already logged in? Skip the form.
  const { user, role } = await getCurrentUser();
  if (user) redirect(homeFor(role));

  return (
    <AuthShell
      headline="Find your room near campus."
      blurb="Create a free account to save the rooms you like near PHINMA University of Iloilo, or to post a room you rent out."
      points={["Free for students", "Every room approved by our team", "Call the owner directly"]}
    >
      <div className="group/choice">
        <h1 className="text-[1.75rem] font-extrabold tracking-tight">Create your account</h1>
        <p className="mb-6 mt-2 text-[0.9375rem] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4">
            Log in
          </Link>
        </p>
        <form action={signup} className="grid gap-[1.125rem]">
          {error && (
            <p role="alert" className="alert-error">
              {error}
            </p>
          )}
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="label mb-1.5 p-0">I am a</legend>
            {ACCOUNT_TYPES.map((type, n) => (
              <label key={type.value} className="relative block">
                <input
                  type="radio"
                  name="account_type"
                  value={type.value}
                  defaultChecked={n === 0}
                  className="peer absolute opacity-0"
                />
                <span className="block cursor-pointer rounded-xl border border-field-line bg-card px-4 py-3.5 font-bold peer-checked:border-ink peer-checked:bg-navy-soft peer-checked:shadow-[0_0_0_1px_var(--color-ink)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                  {type.title}
                  <small className="mt-0.5 block text-xs font-medium text-muted-foreground">{type.hint}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" autoComplete="name" placeholder="Juan Dela Cruz" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@email.com" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              minLength={8}
              maxLength={72}
              required
            />
            <p className="hint">At least 8 characters, with a letter and a number.</p>
          </div>
          <label className="flex items-start gap-3 text-sm leading-snug">
            <input type="checkbox" name="agree_privacy" required className="mt-0.5 h-4 w-4" />
            <span>
              I have read the{" "}
              <Link href="/privacy" className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-2">
                Privacy page
              </Link>{" "}
              and agree to it.
            </span>
          </label>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
        <SocialButtons mode="signup" />
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          By continuing with Google you agree to our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy page
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
