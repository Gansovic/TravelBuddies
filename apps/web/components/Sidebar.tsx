"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const items = [
  { href: "/memories", label: "Memories", icon: "📷" },
  { href: "/itinerary", label: "Itinerary", icon: "🗓️" },
  { href: "/members", label: "Members", icon: "👥" },
  { href: "/expenses", label: "Expenses", icon: "💰" },
  { href: "/polls", label: "Polls", icon: "🗳️" },
  { href: "/recap", label: "Recap", icon: "📊" }
];

export function Sidebar({ basePath = '' }: { basePath?: string }) {
  const pathname = usePathname();
  return (
    <aside style={{ width: 220, borderRight: "1px solid #eee", padding: 12 }}>
      <h2 style={{ marginBottom: 12 }}>TravelBuddies</h2>
      
      {/* Back to Main button when inside a trip */}
      {basePath && (
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            ← Back to Main
          </Link>
        </div>
      )}
      
      <nav>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li key={item.href} style={{ marginBottom: 6 }}>
              <Link
                href={`${basePath}${item.href}`}
                className={clsx(
                  "flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors",
                  pathname?.startsWith(`${basePath}${item.href}`) && "font-bold bg-blue-50 text-blue-700"
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
