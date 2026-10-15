import { notFound } from "next/navigation";
import { errorText, noticeText } from "@/lib/messages";
import { PLAN_PRICES } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./_components/admin-sidebar";
import { OtherRoomCard } from "./_components/other-room-card";
import { PendingRoomCard } from "./_components/pending-room-card";
import { PlanRequestCard } from "./_components/plan-request-card";
import { ReportCard } from "./_components/report-card";
import { ReviewSection } from "./_components/review-section";
import type { OpenReport, OtherRoom, PendingCheck, PlanRequest } from "./_components/types";

// The team's review page. Its address is not linked anywhere on the site.
//
// IMPORTANT: a hidden address is NOT the lock. Anyone could guess or be
// told the address. The lock is the two checks below, plus the database,
// which only lets an admin read the permits and call review_listing().
//
// This file only loads the data and lays out the page. Each kind of card
// lives in ./_components.

export default async function ReviewDesk({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  // The address carries only short codes; the text comes from our own list.
  const params = await searchParams;
  const notice = noticeText(params.notice);
  const error = errorText(params.error);
  const supabase = await createClient();

  // Check 1: logged in? (Logged-out visitors see the Not found page, so
  // they cannot even tell this page exists.)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Check 2: is this account an admin? Row Level Security lets each user
  // read only their own profile row, so this returns the caller's own role.
  const { data: me } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || me.role !== "admin") notFound();

  // Pending rooms with their private permit check. Only admins can read
  // listing_checks, so for anyone else this would return nothing.
  const { data: pending, error: loadError } = await supabase
    .from("listing_checks")
    .select(
      "permit_number, owner_or_caretaker, open_beds, listings!inner(id, owner_id, description, price_per_month, distance_km, contact_phone, address, photo_path, created_at)",
    )
    .eq("listings.approval_status", "pending")
    .order("created_at", { ascending: true });
  const rows = (pending ?? []) as unknown as PendingCheck[];

  // The newest 50 rooms that are already decided, so the team can remove
  // spam, mistakes or leftover test rooms. Admins may read every room.
  const { data: others } = await supabase
    .from("listings")
    .select("id, owner_id, description, price_per_month, contact_phone, approval_status, rating_count")
    .neq("approval_status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  const otherRooms = (others ?? []) as OtherRoom[];

  // Open reports from students about rooms they can see, oldest first.
  const { data: reportData } = await supabase
    .from("room_reports")
    .select("id, reason, note, created_at, reporter_id, listings!inner(id, description, contact_phone)")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  const openReports = (reportData ?? []) as unknown as OpenReport[];

  // Owners who asked for a paid plan and are waiting for the team.
  const { data: requestData } = await supabase
    .from("plan_requests")
    .select("id, owner_id, plan, pay_method, contact_phone, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const planRequests = (requestData ?? []) as PlanRequest[];

  // Names for everyone mentioned above (admins may read all profiles).
  // Sample rooms have no owner.
  const personIds = [
    ...new Set(
      [
        ...rows.map((r) => r.listings.owner_id),
        ...otherRooms.map((r) => r.owner_id),
        ...planRequests.map((r) => r.owner_id),
        ...openReports.map((r) => r.reporter_id),
      ].filter((id): id is string => id !== null),
    ),
  ];
  const { data: people } = personIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", personIds)
    : { data: [] as { id: string; full_name: string }[] };
  const ownerName = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="grid flex-1 bg-surface lg:grid-cols-[260px_minmax(0,1fr)]">
      <AdminSidebar
        name={me.full_name || user.email || ""}
        reports={openReports.length}
        planRequests={planRequests.length}
      />

      <main id="main" className="flex min-w-0 flex-col gap-6 px-4 py-8 sm:px-10 sm:py-10">
        <header>
          <p className="eyebrow mb-2">Team only</p>
          <h1 className="text-[2rem] font-extrabold tracking-tight">Rooms waiting for review</h1>
          <p className="mt-2 max-w-2xl text-[0.9375rem] text-muted-foreground">
            Check the permit and call the owner before you approve. Approving
            makes the room visible to students.
          </p>
        </header>

        {notice && (
          <p role="status" className="alert-success">
            {notice}
          </p>
        )}
        {(error || loadError) && (
          <p role="alert" className="alert-error">
            {error ?? "We could not load the rooms waiting for review. Please refresh and try again."}
          </p>
        )}

        <ReviewSection id="waiting" emptyText="Nothing is waiting for review." isEmpty={rows.length === 0}>
          {rows.map((row) => (
            <PendingRoomCard key={row.listings.id} row={row} ownerName={ownerName} />
          ))}
        </ReviewSection>

        <ReviewSection
          id="reports"
          title="Reports from students"
          intro={
            <>
              Call the owner to check. &ldquo;Hide room until checked&rdquo; takes the room off
              the student list (it goes back to waiting for review) and closes every open
              report about it.
            </>
          }
          emptyText="No open reports."
          isEmpty={openReports.length === 0}
        >
          {openReports.map((report) => (
            <ReportCard key={report.id} report={report} ownerName={ownerName} />
          ))}
        </ReviewSection>

        <ReviewSection
          id="plans"
          title="Plan requests"
          intro={
            <>
              Owners who asked for Premium Owner (₱{PLAN_PRICES.premium} a month) or Property
              Manager (₱{PLAN_PRICES.manager} a month). Call them, give them the payment
              details, and press Activate only after the money has arrived.
            </>
          }
          emptyText="No plan requests waiting."
          isEmpty={planRequests.length === 0}
        >
          {planRequests.map((request) => (
            <PlanRequestCard key={request.id} request={request} ownerName={ownerName} />
          ))}
        </ReviewSection>

        <ReviewSection
          id="other"
          title="Other rooms"
          intro="Rooms already approved or rejected. Delete spam, mistakes and test rooms here, or reset the star ratings of a room."
          emptyText="No other rooms."
          isEmpty={otherRooms.length === 0}
        >
          {otherRooms.map((room) => (
            <OtherRoomCard key={room.id} room={room} ownerName={ownerName} />
          ))}
        </ReviewSection>
      </main>
    </div>
  );
}
