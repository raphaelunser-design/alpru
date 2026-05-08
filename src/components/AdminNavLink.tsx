"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isOwnerAdminEmail } from "@/lib/adminShared";
import { fetchJsonWithTimeout } from "@/lib/clientFetch";
import { supabase } from "@/lib/supabase";

export default function AdminNavLink({ className = "" }: { className: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? "";
      const email = data.session?.user?.email ?? null;
      if (!token) {
        if (mounted) setVisible(isOwnerAdminEmail(email));
        return;
      }
      try {
        const { response } = await fetchJsonWithTimeout("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }, 10000);
        if (mounted) setVisible(response.ok || isOwnerAdminEmail(email));
      } catch {
        if (mounted) setVisible(isOwnerAdminEmail(email));
      }
    };

    check();
    const { data: listener } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!visible) return null;

  return (
    <Link className={className} href="/admin">
      Admin
    </Link>
  );
}
