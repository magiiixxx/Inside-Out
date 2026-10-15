import { cookies } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { DisplayControls } from "@/components/display-controls";
import { requireUser } from "@/lib/auth";
import { parsePrefs, PREFS_COOKIE } from "@/lib/preferences";
import { SettingsShell } from "../_components/settings-shell";

export const dynamic = "force-dynamic";

export default async function DisplaySettings() {
  await requireUser();
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);

  return (
    <SettingsShell
      title="Display & Accessibility"
      intro="Choose how BahayFind looks and moves. The same choices are in the account menu."
    >
      <Card>
        <CardContent className="pt-6 sm:max-w-xl">
          <DisplayControls initial={prefs} variant="page" />
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
