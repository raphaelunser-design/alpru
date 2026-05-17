"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminAuthContext } from "@/lib/adminClientAuth";
import { isOwnerAdminEmail } from "@/lib/adminShared";
import { fetchJsonWithTimeout } from "@/lib/clientFetch";

export default function AdminNavLink({ className = "" }: { className: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const context = await getAdminAuthContext();
      const email = context.email;
      if (!Object.keys(context.headers).length) {
        if (mounted) setVisible(isOwnerAdminEmail(email));
        return;
      }
      try {
        const { response } = await fetchJsonWithTimeout("/api/admin/me", {
          headers: context.headers,
          cache: "no-store",
        }, 10000);
        if (mounted) setVisible(response.ok || isOwnerAdminEmail(email));
      } catch {
        if (mounted) setVisible(isOwnerAdminEmail(email));
      }
    };

    check();
    return () => {
      mounted = false;
    };
  }, []);

  if (!visible) return null;

  return (
    <Link className={className} href="/admin">
      Admin
    </Link>
  );
}
