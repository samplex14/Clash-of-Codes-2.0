"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sword } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const [usn, setUsn] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedYear, setSelectedYear] = useState<"1st" | "2nd" | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ usn?: string; fullName?: string; year?: string; api?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!usn.trim()) newErrors.usn = "Enter your USN, Warrior.";
    if (!fullName.trim()) newErrors.fullName = "Enter your name, Warrior.";
    if (!selectedYear) newErrors.year = "Choose your year, Warrior.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, fullName, year: selectedYear }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to enlist.");
      }

      router.push("/arena");
    } catch (err: any) {
      setErrors({ api: err.message });
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#1a1a2e] text-white selection:bg-purple-500/30 font-sans">
      {/* Background Texture & Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#0d0d1a_100%)] opacity-80" />

      {/* Purple Glowing Cracks (Background) */}
      <div className="absolute top-1/4 left-1/4 w-[1px] h-32 bg-purple-500/50 blur-[2px] -rotate-45 shadow-[0_0_10px_#a855f7]" />
      <div className="absolute bottom-1/4 right-1/4 w-[1px] h-40 bg-purple-500/50 blur-[2px] rotate-12 shadow-[0_0_10px_#a855f7]" />
      <div className="absolute top-1/3 right-10 w-[1px] h-24 bg-purple-600/40 blur-[3px] rotate-90 shadow-[0_0_10px_#a855f7]" />
      <div className="absolute bottom-10 left-20 w-[1px] h-32 bg-purple-600/40 blur-[2px] -rotate-12 shadow-[0_0_10px_#a855f7]" />

      {/* Title Section */}
      <div className="z-10 text-center mb-8 sm:mb-12 px-4 mt-8 sm:mt-0">
        <h1 
          className="font-cinzel-decorative text-4xl sm:text-5xl md:text-6xl font-black text-[#c8c8d0] tracking-wider relative inline-block"
          style={{
            textShadow: `
              0 0 10px rgba(139, 92, 246, 0.6),
              2px 2px 0px #2e2e3a,
              4px 4px 0px #1a1a2e,
              6px 6px 4px rgba(0,0,0,0.8)
            `
          }}
        >
          CLASH OF CODES <span className="block sm:inline mt-2 sm:mt-0">2.0</span>
        </h1>
        <p className="mt-4 text-[#888899] text-[10px] sm:text-xs tracking-[0.25em] font-sans uppercase opacity-80 font-medium">
          RYRHR MY OBSIDIAN RUNE R PRTRESS
        </p>
      </div>

      {/* Stone Arch Container */}
      <div className="relative z-10 w-full max-w-[400px] px-4 sm:px-0 mb-8">
        {/* The Arch Border Structure */}
        <div 
          className="relative rounded-t-[200px] border-[24px] sm:border-[32px] border-[#4a4a5a] bg-[#2a2a3e] shadow-[0_0_50px_rgba(120,0,200,0.4)] overflow-hidden"
          style={{
            borderImageSource: 'linear-gradient(to bottom, #555566, #3a3a4a)',
            boxShadow: '0 0 0 1px #2a2a3e inset, 0 0 20px rgba(0,0,0,0.5) inset, 0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Inner Shadow Overlay for Arch Depth */}
          <div className="absolute inset-0 pointer-events-none rounded-t-[165px] shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] z-20" />

          {/* Form Internal Container */}
          <div className="bg-[#2e2e42] p-6 pt-12 pb-8 min-h-[400px] flex flex-col relative rounded-t-[170px]">
            
            {/* Header */}
            <div className="text-center mb-6 mt-2 relative z-10">
              <h2 className="font-serif text-white text-2xl relative inline-block pb-2 tracking-wide font-semibold">
                Join Clan
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500/70 shadow-[0_0_8px_purple] rounded-full" />
              </h2>
            </div>

            {/* Form Fields */}
            <div className="space-y-5 relative z-10">
              
              {/* USN Field */}
              <div className="group">
                <label className="block text-white/80 text-[13px] font-serif mb-1 pl-1">USN</label>
                <div className="relative">
                  <input
                    type="text"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    placeholder="E.G. 1RV21CS001"
                    className="w-full bg-[#1e1e2e] border border-[#4a4a6a] rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-sans"
                  />
                  <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                </div>
                {errors.usn && <p className="text-red-400 text-xs mt-1 pl-1 font-medium">{errors.usn}</p>}
              </div>

              {/* Full Name Field */}
              <div className="group">
                <label className="block text-white/80 text-[13px] font-serif mb-1 pl-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Barbarian King"
                    className="w-full bg-[#1e1e2e] border border-[#4a4a6a] rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-sans"
                  />
                  <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                </div>
                {errors.fullName && <p className="text-red-400 text-xs mt-1 pl-1 font-medium">{errors.fullName}</p>}
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-white/80 text-[13px] font-serif mb-2 pl-1">Year</label>
                <div className="flex gap-4">
                  {(["1st", "2nd"] as const).map((yr) => {
                     const isSelected = selectedYear === yr;
                     return (
                        <button
                          key={yr}
                          onClick={() => setSelectedYear(yr)}
                          className={cn(
                            "flex-1 py-3 rounded-md border text-sm font-semibold transition-all relative overflow-hidden",
                            isSelected
                              ? "bg-[#3a3a5a] border-gray-400 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]"
                              : "bg-[#1e1e2e] border-[#4a4a6a] text-gray-400 hover:border-gray-500 hover:text-gray-300"
                          )}
                        >
                          {yr} Year
                          {isSelected && (
                            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                          )}
                        </button>
                     );
                  })}
                </div>
                {errors.year && <p className="text-red-400 text-xs mt-1 pl-1 font-medium">{errors.year}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-6 pb-2 relative flex justify-center">
                {/* Decorative Swords */}
                <Sword className="absolute left-0 bottom-6 text-gray-600/50 w-6 h-6 rotate-[-45deg]" />
                <Sword className="absolute right-0 bottom-6 text-gray-600/50 w-6 h-6 rotate-[45deg] scale-x-[-1]" />

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full mx-8 relative group bg-gradient-to-b from-[#4a9a3a] to-[#3a7a2a] border-[3px] border-[#2a5a1a] rounded-lg py-3 flex items-center justify-center gap-3 shadow-[0_4px_0_#1a3a1a] active:shadow-none active:translate-y-1 transition-all hover:brightness-110 active:scale-[0.97]"
                >
                  <Sword className="w-4 h-4 text-white fill-white transform rotate-[-135deg]" />
                  <span className="font-bold text-white tracking-widest text-lg drop-shadow-md uppercase font-sans">
                    {loading ? "ENLISTING..." : "TRAIN TROOPS"}
                  </span>
                  <Sword className="w-4 h-4 text-white fill-white transform rotate-[-45deg]" />
                </button>
              </div>
              
              {errors.api && (
                <div className="text-red-400 text-center text-xs font-semibold mt-2">
                  {errors.api}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
