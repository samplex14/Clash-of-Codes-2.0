"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingRadar from "@/components/ui/loading-radar";

export default function ArenaRedirect(): null {
  const router = useRouter();

  useEffect(() => {
    const year: string | null = window.localStorage.getItem("participant_year");
    if (year === "1st") {
      router.replace("/arena/1st");
      return;
    }

    if (year === "2nd") {
      router.replace("/arena/2nd");
      return;
    }

    router.replace("/");
  }, [router]);

  return null;
}
