import { signInWithProvider } from "@/app/auth/actions";

// "Continue with Google" for the Log in and Sign up pages. It is shown only when
// the team has switched it on (NEXT_PUBLIC_GOOGLE_LOGIN set to "true", after
// setting Google up in Supabase). Until then nothing is shown, so visitors never
// meet a button that cannot work.
//
// The email form's "I am a Student / Owner" choice cannot travel through Google,
// so each button carries its own choice. The Sign up page shows only the button
// that matches the choice ticked above it (it sits inside a "group/choice"
// wrapper, see signup/page.tsx; the CSS reads which radio is ticked, so it needs
// no JavaScript).
//
// Google is the only sign-in method besides email. (Facebook was offered for a
// while and was removed, ticket 30.)

const BASE =
  "inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-[var(--radius-control)] px-4 font-bold";
const GOOGLE_STYLE = `${BASE} border border-field-line bg-card text-ink hover:bg-surface`;

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function SocialButtons({ mode }: { mode: "login" | "signup" }) {
  if (process.env.NEXT_PUBLIC_GOOGLE_LOGIN !== "true") return null;

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="flex items-center gap-3 text-[0.8125rem] text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </p>
      <form action={signInWithProvider} className="flex flex-col gap-2.5">
        <input type="hidden" name="from" value={mode} />
        {mode === "login" ? (
          <button type="submit" name="choice" value="google:student" className={GOOGLE_STYLE}>
            <GoogleMark />
            Continue with Google
          </button>
        ) : (
          <div className="flex flex-col">
            <div className="group-has-[input[value=owner]:checked]/choice:hidden">
              <button type="submit" name="choice" value="google:student" className={GOOGLE_STYLE}>
                <GoogleMark />
                Sign up with Google as a student
              </button>
            </div>
            <div className="hidden group-has-[input[value=owner]:checked]/choice:block">
              <button type="submit" name="choice" value="google:owner" className={GOOGLE_STYLE}>
                <GoogleMark />
                Sign up with Google as an owner
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
