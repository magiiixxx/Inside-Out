import { getContact } from "@/lib/support-info";

// The ways to reach the BahayFind team, as links. Shows nothing at all when the
// team has not set any contact details yet.

export function ContactLines({ heading, className }: { heading?: string; className?: string }) {
  const { phone, email, facebook } = getContact();
  if (!phone && !email && !facebook) return null;

  return (
    <div className={className}>
      {heading && <p className="mb-1.5 text-[0.9375rem]">{heading}</p>}
      <ul className="flex flex-col gap-1.5 text-[0.9375rem]">
      {phone && (
        <li>
          Call or text: <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
        </li>
      )}
      {email && (
        <li>
          Email: <a href={`mailto:${email}`}>{email}</a>
        </li>
      )}
      {facebook && (
        <li>
          <a href={facebook} target="_blank" rel="noopener noreferrer">
            Message us on Facebook
          </a>
        </li>
      )}
      </ul>
    </div>
  );
}
