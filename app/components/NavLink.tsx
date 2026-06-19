"use client";
import { usePathname } from 'next/navigation';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <a href={href} className={"px-3 py-1.5 rounded-lg font-medium transition-colors " + (isActive ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 hover:text-blue-600")}>
      {children}
    </a>
  );
}

export default NavLink;
