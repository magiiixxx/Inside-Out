import { sendPasswordLink, signOutOtherDevices } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { errorText, noticeText } from "@/lib/messages";
import { SettingsShell } from "../_components/settings-shell";

export const dynamic = "force-dynamic";

// "facebook" is kept so that accounts made while Facebook sign-in existed still
// show how they were created. Facebook sign-in itself was removed (ticket 30).
const PROVIDER_NAMES: Record<string, string> = { email: "Email and password", google: "Google", facebook: "Facebook (no longer offered)" };

export default async function SecuritySettings({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const notice = noticeText(params.notice);
  const error = errorText(params.error);
  const { user } = await requireUser();

  const providers = (user.identities ?? []).map((identity) => PROVIDER_NAMES[identity.provider] ?? identity.provider);
  const hasPassword = (user.identities ?? []).some((identity) => identity.provider === "email");

  return (
    <SettingsShell title="Security" intro="How you sign in, and how to keep your account safe.">
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

      <Card>
        <CardHeader>
          <CardTitle>How you sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Sign-in method</dt>
            <dd className="font-semibold">{providers.length > 0 ? providers.join(", ") : "Email and password"}</dd>
            <dt className="text-muted-foreground">Last sign-in</dt>
            <dd className="font-semibold">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })
                : "Just now"}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            {hasPassword
              ? "We will email a one-time link to the address on your account, where you can choose a new password."
              : "Your account was made with Google or Facebook, so it has no BahayFind password yet. Create one now: we will email a one-time link to your address. After that you can log in with your email and password, which is the only way back in for an account made with Facebook."}
          </p>
        </CardHeader>
        <CardContent>
          <form action={sendPasswordLink}>
            <Button type="submit" variant="outline">
              Email me a password link
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your other devices</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lost a phone, or used a shared computer? This logs you out everywhere except the device you are using now.
          </p>
        </CardHeader>
        <CardContent>
          <form action={signOutOtherDevices}>
            <Button type="submit" variant="outline">
              Log out my other devices
            </Button>
          </form>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
