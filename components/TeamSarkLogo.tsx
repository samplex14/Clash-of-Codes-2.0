"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function TeamSarkLogo() {
  return (
    <div className="fixed top-6 left-6 z-[100]">
      <Link href="/" className="block hover:scale-105 transition-transform duration-300 ease-out filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
        <Image
          src="/assets/sarklogo.png"
          alt="Team Sark Logo"
          width={240}
          height={80}
          className="h-10 md:h-14 w-auto object-contain"
          priority
        />
      </Link>
    </div>
  );
}
