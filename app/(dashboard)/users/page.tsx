"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsersMainPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/users/all");
  }, [router]);

  return null;
}
