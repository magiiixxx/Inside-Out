import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

// One titled block of the team page (rooms waiting, reports, plan requests,
// other rooms), with a message when it is empty.

export function ReviewSection({
  id,
  title,
  intro,
  emptyText,
  isEmpty,
  children,
}: {
  id: string;
  title?: string;
  intro?: ReactNode;
  emptyText: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-4 pt-4 first:pt-0">
      {title && (
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          {intro && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{intro}</p>}
        </div>
      )}
      {isEmpty ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">{emptyText}</CardContent>
        </Card>
      ) : (
        children
      )}
    </section>
  );
}
