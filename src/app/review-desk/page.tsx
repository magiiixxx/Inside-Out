import { notFound } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { activatePlan, deleteAnyRoom, dismissPlanRequest, resolveReport, reviewRoom } from "@/app/review-desk/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/site-header";
import { DeleteRoomButton } from "@/components/delete-room-button";
import { errorText, noticeText } from "@/lib/messages";
import { payMethodLabel } from "@/lib/payment";
import { PLAN_NAMES, PLAN_PRICES, type Plan } from "@/lib/plans";
import { photoUrl } from "@/lib/photos";
import { reportReasonLabel } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";

// The team's review page. Its address is not linked anywhere on the site.
//
// IMPORTANT: a hidden address is NOT the lock. Anyone could guess or be
// told the address. The lock is the two checks below, plus the database,
// which only lets an admin read the permits and call review_listing().

type PendingCheck = {
  permit_number: string;
  owner_or_caretaker: string;
  open_beds: number;
  listings: {
    id: string;
    owner_id: string;
    description: string;
    price_per_month: number;
    distance_km: number;
    contact_phone: string;
    address: string | null;
    photo_path: string | null;
    created_at: string;
  };
};

type PlanRequest = {
  id: string;
  owner_id: string;
  plan: string;
  pay_method: string;
  contact_phone: string;
  created_at: string;
};

type OpenReport = {
  id: string;
  reason: string;
  note: string | null;
  created_at: string;
  reporter_id: string;
  listings: { id: string; description: string; contact_phone: string };
};

type OtherRoom = {
  id: string;
  owner_id: string | null;
  description: string;
  price_per_month: number;
  contact_phone: string;
  approval_status: "approved" | "rejected";
};

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
    .select("id, owner_id, description, price_per_month, contact_phone, approval_status")
    .neq("approval_status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  const otherRooms = (others ?? []) as OtherRoom[];

  // Open reports from students about rooms they can see (admins may read
  // every report). Oldest first.
  const { data: reportData } = await supabase
    .from("room_reports")
    .select("id, reason, note, created_at, reporter_id, listings!inner(id, description, contact_phone)")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  const openReports = (reportData ?? []) as unknown as OpenReport[];

  // Owners who asked for Premium and are waiting for the team (admins may
  // read every plan request).
  const { data: requestData } = await supabase
    .from("plan_requests")
    .select("id, owner_id, plan, pay_method, contact_phone, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const planRequests = (requestData ?? []) as PlanRequest[];

  // Owner names (admins may read all profiles). Sample rooms have no owner.
  const ownerIds = [
    ...new Set(
      [
        ...rows.map((r) => r.listings.owner_id),
        ...otherRooms.map((r) => r.owner_id),
        ...planRequests.map((r) => r.owner_id),
        ...openReports.map((r) => r.reporter_id),
      ].filter(
        (id): id is string => id !== null,
      ),
    ),
  ];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ownerIds)
    : { data: [] as { id: string; full_name: string }[] };
  const ownerName = new Map((owners ?? []).map((o) => [o.id, o.full_name]));

  return (
    <div className="grid flex-1 bg-surface lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="on-dark flex flex-wrap items-center justify-between gap-x-6 gap-y-4 bg-navy px-5 py-5 text-white lg:flex-col lg:items-stretch lg:justify-start lg:gap-7 lg:px-5 lg:py-7">
        <div className="flex items-center gap-2.5">
          <Logo onDark />
          <span className="rounded-md bg-amber px-[7px] py-[3px] text-[0.6875rem] font-bold tracking-wide text-ink">ADMIN</span>
        </div>

        <nav aria-label="Team" className="grid gap-1 text-[0.9375rem] font-semibold">
          <a
            href="#waiting"
            className="block rounded-[10px] bg-navy-deep px-4 py-3 text-white shadow-[inset_3px_0_0_var(--color-amber)]"
          >
            Rooms waiting for review
          </a>
          <a href="#reports" className="block rounded-[10px] px-4 py-3 text-navy-text hover:text-white">
            Reports{openReports.length > 0 ? ` (${openReports.length})` : ""}
          </a>
          <a href="#plans" className="block rounded-[10px] px-4 py-3 text-navy-text hover:text-white">
            Plan requests{planRequests.length > 0 ? ` (${planRequests.length})` : ""}
          </a>
          <a href="#other" className="block rounded-[10px] px-4 py-3 text-navy-text hover:text-white">
            Other rooms
          </a>
        </nav>

        <div className="flex items-center gap-3 lg:mt-auto lg:border-t lg:border-navy-edge lg:pt-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-[0.8125rem] font-extrabold text-ink">
            {initials(me.full_name || user.email || "")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{me.full_name || user.email}</p>
            <form action={logout}>
              <button type="submit" className="text-[0.8125rem] text-navy-text underline-offset-4 hover:text-white hover:underline">
                Log out
              </button>
            </form>
          </div>
        </div>
      </aside>

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

        <section id="waiting" className="flex scroll-mt-6 flex-col gap-5">
          {rows.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Nothing is waiting for review.
              </CardContent>
            </Card>
          ) : (
            rows.map((row) => {
              const room = row.listings;
              return (
                <Card key={room.id} className="max-w-3xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg leading-snug">{room.description}</CardTitle>
                    <p className="price">
                      ₱{Number(room.price_per_month).toLocaleString()}
                      <small> / month · {Number(room.distance_km)} km from PHINMA UI</small>
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    {photoUrl(room.photo_path) && (
                      // eslint-disable-next-line @next/next/no-img-element -- stored in Supabase Storage
                      <img
                        src={photoUrl(room.photo_path) ?? ""}
                        alt="Photo uploaded by the owner"
                        loading="lazy"
                        className="h-56 w-full rounded-xl object-cover"
                      />
                    )}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 rounded-xl bg-surface p-4 text-sm">
                      <dt className="text-muted-foreground">Posted by</dt>
                      <dd className="font-semibold">{ownerName.get(room.owner_id) || "(no name)"}</dd>
                      <dt className="text-muted-foreground">Address</dt>
                      <dd className="break-words">{room.address ?? "(none)"}</dd>
                      <dt className="text-muted-foreground">Phone to call</dt>
                      <dd>
                        <a href={`tel:${room.contact_phone.replace(/\s+/g, "")}`}>{room.contact_phone}</a>
                      </dd>
                      <dt className="text-muted-foreground">Permit number</dt>
                      <dd className="font-bold">{row.permit_number}</dd>
                      <dt className="text-muted-foreground">Owner or caretaker</dt>
                      <dd className="capitalize">{row.owner_or_caretaker}</dd>
                      <dt className="text-muted-foreground">Open beds</dt>
                      <dd>{row.open_beds}</dd>
                    </dl>

                    <div className="flex flex-col gap-4">
                      <form action={reviewRoom}>
                        <input type="hidden" name="listing_id" value={room.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <Button type="submit" variant="accent">
                          Approve
                        </Button>
                      </form>
                      <form action={reviewRoom} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <input type="hidden" name="listing_id" value={room.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <div className="flex flex-1 flex-col gap-1.5">
                          <Label htmlFor={`reason-${room.id}`}>Reason for rejecting (the owner will read this)</Label>
                          <Input
                            id={`reason-${room.id}`}
                            name="reason"
                            minLength={5}
                            maxLength={300}
                            required
                            placeholder="e.g. The phone number did not answer"
                          />
                        </div>
                        <Button type="submit" variant="outline">
                          Reject
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>

        <section id="reports" className="flex scroll-mt-6 flex-col gap-4 pt-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Reports from students</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Call the owner to check. &ldquo;Hide room until checked&rdquo; takes the
              room off the student list (it goes back to waiting for review) and
              closes every open report about it.
            </p>
          </div>
          {openReports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No open reports.
              </CardContent>
            </Card>
          ) : (
            openReports.map((report) => (
              <Card key={report.id} className="max-w-3xl">
                <CardContent className="flex flex-col gap-4 pt-6">
                  <p className="font-bold leading-snug">{report.listings.description}</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Problem</dt>
                    <dd className="font-semibold">{reportReasonLabel(report.reason)}</dd>
                    {report.note && (
                      <>
                        <dt className="text-muted-foreground">Detail</dt>
                        <dd className="break-words">{report.note}</dd>
                      </>
                    )}
                    <dt className="text-muted-foreground">Reported by</dt>
                    <dd>{ownerName.get(report.reporter_id) || "(no name)"}</dd>
                    <dt className="text-muted-foreground">Owner phone</dt>
                    <dd>
                      <a href={`tel:${report.listings.contact_phone.replace(/\s+/g, "")}`}>
                        {report.listings.contact_phone}
                      </a>
                    </dd>
                  </dl>
                  <div className="flex flex-wrap gap-3">
                    <form action={resolveReport}>
                      <input type="hidden" name="report_id" value={report.id} />
                      <input type="hidden" name="hide" value="1" />
                      <Button type="submit" variant="accent">
                        Hide room until checked
                      </Button>
                    </form>
                    <form action={resolveReport}>
                      <input type="hidden" name="report_id" value={report.id} />
                      <Button type="submit" variant="outline">
                        Mark resolved
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <section id="plans" className="flex scroll-mt-6 flex-col gap-4 pt-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Plan requests</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Owners who asked for Premium Owner (₱{PLAN_PRICES.premium} a month) or Property Manager (₱{PLAN_PRICES.manager} a month). Call them,
              give them the payment details, and press Activate only after the
              money has arrived.
            </p>
          </div>
          {planRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No plan requests waiting.
              </CardContent>
            </Card>
          ) : (
            planRequests.map((request) => (
              <Card key={request.id} className="max-w-3xl">
                <CardContent className="flex flex-col gap-4 pt-6">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Owner</dt>
                    <dd className="font-semibold">{ownerName.get(request.owner_id) || "(no name)"}</dd>
                    <dt className="text-muted-foreground">Wants</dt>
                    <dd>{PLAN_NAMES[request.plan as Plan] ?? request.plan}</dd>
                    <dt className="text-muted-foreground">Will pay by</dt>
                    <dd>{payMethodLabel(request.pay_method)}</dd>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>
                      <a href={`tel:${request.contact_phone.replace(/s+/g, "")}`}>{request.contact_phone}</a>
                    </dd>
                    <dt className="text-muted-foreground">Asked on</dt>
                    <dd>{new Date(request.created_at).toLocaleDateString("en-PH")}</dd>
                  </dl>
                  <div className="flex flex-wrap gap-3">
                    <form action={activatePlan}>
                      <input type="hidden" name="request_id" value={request.id} />
                      <Button type="submit" variant="accent">
                        Activate plan
                      </Button>
                    </form>
                    <form action={dismissPlanRequest}>
                      <input type="hidden" name="request_id" value={request.id} />
                      <Button type="submit" variant="outline">
                        Dismiss
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <section id="other" className="flex scroll-mt-6 flex-col gap-4 pt-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Other rooms</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Rooms already approved or rejected. Delete spam, mistakes and test
              rooms here.
            </p>
          </div>
          {otherRooms.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No other rooms.
              </CardContent>
            </Card>
          ) : (
            otherRooms.map((room) => (
              <Card key={room.id} className="max-w-3xl">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">{room.description}</CardTitle>
                  <span className={`chip shrink-0 capitalize ${room.approval_status === "approved" ? "chip-ok" : "chip-alert"}`}>
                    {room.approval_status}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">
                      ₱{Number(room.price_per_month).toLocaleString()} / month
                    </span>
                    <span>{room.contact_phone}</span>
                    <span>
                      {room.owner_id ? ownerName.get(room.owner_id) || "(no name)" : "(no owner)"}
                    </span>
                  </div>
                  <DeleteRoomButton action={deleteAnyRoom} listingId={room.id} />
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
