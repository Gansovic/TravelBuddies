"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const items = [
  { href: "/itinerary", label: "Itinerary" },
  { href: "/polls", label: "Polls" },
  { href: "/expenses", label: "Expenses" },
  { href: "/recap", label: "Recap" }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside style={{ width: 220, borderRight: "1px solid #eee", padding: 12 }}>
      <h2 style={{ marginBottom: 12 }}>TravelBuddies</h2>
      <nav>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li key={item.href} style={{ marginBottom: 6 }}>
              <Link
                href={item.href}
                className={clsx(
                  pathname?.startsWith(item.href) && "font-bold"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
