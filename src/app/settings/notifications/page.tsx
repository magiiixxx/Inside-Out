import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { SettingsShell } from "../_components/settings-shell";

export const dynamic = "force-dynamic";

// BahayFind sends no notifications yet. This page says so, instead of showing
// switches that would do nothing. When email or SMS notices are built (see
// docs/LATER.md), their switches belong here.

export default async function NotificationSettings() {
  await requireUser();

  return (
    <SettingsShell title="Notifications" intro="What BahayFind sends you.">
      <Card>
        <CardHeader>
          <CardTitle>Nothing to switch on or off yet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-[0.9375rem]">
          <p>
            BahayFind does not send you emails or text messages about rooms, ratings or reports. The only emails
            you get are the ones you ask for: confirming your email address, and password links.
          </p>
          <p>
            Owners see warnings on their home page when a room is about to be hidden, and when our team approves,
            rejects or holds a room.
          </p>
          <p className="text-sm text-muted-foreground">
            Email and phone notices are planned for later. Want them sooner?{" "}
            <Link href="/report-problem?kind=feedback">Tell us</Link>.
          </p>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
