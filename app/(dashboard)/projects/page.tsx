"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProjectsMainPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/projects/active");
  }, [router]);
  
  return null;
}