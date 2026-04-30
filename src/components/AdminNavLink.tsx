"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminNavLink({ className = "" }: { className: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? "";
      if (!token) {
        if (mounted) setVisible(false);
        return;
      }
      const response = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (mounted) setVisible(response.ok);
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
