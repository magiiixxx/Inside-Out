import { logout } from "@/app/auth/actions";
import { Logo } from "@/components/site-header";
import { initials } from "@/lib/utils";

// The navy side panel of the team page: logo, the page's sections, and who is
// logged in. On a phone it becomes a bar across the top.

const LINK = "block rounded-[10px] px-4 py-3 text-navy-text hover:text-white";

export function AdminSidebar({
  name,
  reports,
  planRequests,
}: {
  name: string;
  reports: number;
  planRequests: number;
}) {
  return (
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
        <a href="#reports" className={LINK}>
          Reports{reports > 0 ? ` (${reports})` : ""}
        </a>
        <a href="#plans" className={LINK}>
          Plan requests{planRequests > 0 ? ` (${planRequests})` : ""}
        </a>
        <a href="#other" className={LINK}>
          Other rooms
        </a>
      </nav>

      <div className="flex items-center gap-3 lg:mt-auto lg:border-t lg:border-navy-edge lg:pt-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-[0.8125rem] font-extrabold text-ink">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{name}</p>
          <form action={logout}>
            <button type="submit" className="text-[0.8125rem] text-navy-text underline-offset-4 hover:text-white hover:underline">
              Log out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
