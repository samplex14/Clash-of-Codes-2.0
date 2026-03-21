"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TeamSarkLogo() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const logoSrc = isHomePage ? "/assets/sarklogo.png" : "/assets/sarklogo_white.png";

  return (
    <div className="fixed top-6 left-6 z-[100]">
      <Link href="/" className="block hover:scale-105 transition-transform duration-300 ease-out filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
        <Image
          src={logoSrc}
          alt="Team Sark Logo"
          width={100}
          height={70}
          className="h-8 md:h-10 w-auto object-contain"
          priority
        />
      </Link>
    </div>
  );
}