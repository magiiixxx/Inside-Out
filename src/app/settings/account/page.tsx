import { updateName } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { errorText, noticeText } from "@/lib/messages";
import { PLAN_NAMES, type Plan } from "@/lib/plans";
import { SettingsShell } from "../_components/settings-shell";

export const dynamic = "force-dynamic";

const ROLE_LABELS = { student: "Student", owner: "Boarding house owner", admin: "Team member (admin)" } as const;

export default async function AccountSettings({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const notice = noticeText(params.notice);
  const error = errorText(params.error);
  const { user, role, fullName, plan } = await requireUser();

  return (
    <SettingsShell title="Account settings" intro="Your name and the details of your account.">
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
          <CardTitle>Your name</CardTitle>
          <p className="text-sm text-muted-foreground">
            Shown in the account menu. For owners it is also how our team knows who posted a room.
          </p>
        </CardHeader>
        <CardContent>
          <form action={updateName} className="flex flex-col gap-4 sm:max-w-md">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={fullName}
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
            </div>
            <Button type="submit" className="w-fit">
              Save name
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-all font-semibold">{user.email}</dd>
            <dt className="text-muted-foreground">Account type</dt>
            <dd className="font-semibold">{role ? ROLE_LABELS[role] : "Unknown"}</dd>
            {role === "owner" && (
              <>
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-semibold">{PLAN_NAMES[plan as Plan] ?? "Free"}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="font-semibold">{new Date(user.created_at).toLocaleDateString("en-PH", { dateStyle: "long" })}</dd>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            Your email and account type cannot be changed here. To change your
            password, open the Security tab.
          </p>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
