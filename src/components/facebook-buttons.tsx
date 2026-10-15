import { signInWithFacebook } from "@/app/auth/actions";

// "Continue with Facebook" for the Log in and Sign up pages. Shown only when
// the team has set NEXT_PUBLIC_FACEBOOK_LOGIN to "true" (after setting up the
// Facebook app and the Facebook provider in Supabase). Until then nothing is
// shown, so visitors never meet a button that cannot work.
//
// The email form's "I am a Student / Owner" choice cannot travel through
// Facebook, so each Facebook button carries its own choice. The Sign up page
// shows only the button that matches the choice ticked above it (its content
// sits inside a "group/choice" wrapper, see signup/page.tsx).

const BUTTON =
  "inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-[var(--radius-control)] bg-[#1877f2] px-4 font-bold text-white hover:bg-[#166fe0]";

function FacebookMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.55-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.97.93-1.97 1.89v2.26h3.35l-.54 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

export function FacebookButtons({ mode }: { mode: "login" | "signup" }) {
  if (process.env.NEXT_PUBLIC_FACEBOOK_LOGIN !== "true") return null;

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="flex items-center gap-3 text-[0.8125rem] text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </p>
      <form action={signInWithFacebook} className="flex flex-col gap-2.5">
        <input type="hidden" name="from" value={mode} />
        {mode === "login" ? (
          <button type="submit" className={BUTTON}>
            <FacebookMark />
            Continue with Facebook
          </button>
        ) : (
          <>
            {/* Only the button for the chosen account type shows. The choice is
                the "I am a Student / Owner" radio above; the CSS below reads
                which one is ticked, so it needs no JavaScript. */}
            <div className="group-has-[input[value=owner]:checked]/choice:hidden">
              <button type="submit" name="account_type" value="student" className={BUTTON}>
                <FacebookMark />
                Sign up with Facebook as a student
              </button>
            </div>
            <div className="hidden group-has-[input[value=owner]:checked]/choice:block">
              <button type="submit" name="account_type" value="owner" className={BUTTON}>
                <FacebookMark />
                Sign up with Facebook as an owner
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
