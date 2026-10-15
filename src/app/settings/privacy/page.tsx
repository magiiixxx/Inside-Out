import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { SettingsShell } from "../_components/settings-shell";

export const dynamic = "force-dynamic";

// What other people can and cannot see about this person. There is nothing to
// switch on or off here on purpose: each fact is either always private or
// public only because the owner agreed when posting a room. This page says
// which, so keep it true when the app changes.

export default async function PrivacySettings() {
  const { role } = await requireUser();

  return (
    <SettingsShell title="Privacy" intro="What other people can see about you, in plain words.">
      <Card>
        <CardHeader>
          <CardTitle>Always private</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-[0.9375rem]">
            <li>Your email address.</li>
            <li>Your password. Our team cannot read it.</li>
            <li>The rooms you saved, the ratings you gave and the reports you sent.</li>
            <li>The messages you send to our team from Report a Problem.</li>
            {role === "owner" && <li>The permit number you gave our team when you posted a room.</li>}
          </ul>
        </CardContent>
      </Card>

      {role === "owner" && (
        <Card>
          <CardHeader>
            <CardTitle>Public, because you agreed when posting a room</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ul className="list-disc space-y-1.5 pl-5 text-[0.9375rem]">
              <li>
                Each approved room&apos;s description, price, address, contact phone, photo and star
                average are shown to every visitor.
              </li>
              <li>Students see the phone number so they can call you.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              To take a room off BahayFind, delete it from your owner home page.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-[0.9375rem]">
          <p>
            You can ask our team to delete your account and everything linked to it.{" "}
            <Link href="/report-problem?kind=question">Send us a message</Link> and say you want your account
            deleted.
          </p>
          <p>
            Read the full <Link href="/privacy">Privacy page</Link> for how your information is kept.
          </p>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
