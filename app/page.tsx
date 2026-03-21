"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useParticipant } from "@/components/providers/ParticipantProvider";

export default function HomePage() {
  const router = useRouter();
  const { login } = useParticipant();
  const [usn, setUsn] = useState("");
  const [fullName, setFullName] = useState("");
  // In this glassmorphic design, a toggle represents the 1st/2nd year. 
  // false = 1st year, true = 2nd year.
  const [isSecondYear, setIsSecondYear] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ usn?: string; fullName?: string; api?: string }>({});

  const selectedYear = isSecondYear ? "2nd" : "1st";

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!usn.trim()) newErrors.usn = "Enter your Access Key (USN).";
    if (!fullName.trim()) newErrors.fullName = "Enter your Login Name.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, fullName, year: selectedYear }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to enlist.");
      }

      login(data.participant);
      window.localStorage.setItem("participant_usn", data.participant.usn);
      window.localStorage.setItem("participant_year", selectedYear);
      router.push(selectedYear === "1st" ? "/arena/1st" : "/arena/2nd");
    } catch (err: any) {
      setErrors({ api: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 relative font-clash overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
      >
        <source src="/assets/videoplayback(2).mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 z-[1] bg-black/40" />

      {/* The main glassmorphic container */}
      <div className="relative z-10 w-[95%] max-w-[800px] backdrop-blur-md bg-white/10 border-[1.5px] border-white/20 rounded-3xl p-4 md:p-6 flex flex-col md:flex-row gap-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
        
        {/* Left Side: Title */}
        <div className="flex-none md:flex-1 relative h-full min-h-[450px] -mt-6 -mb-6">
          <Image 
            src="/assets/cardtext.png"
            alt="Clash of Codes 2.0"
            fill
            className="object-fill drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            priority
          />
          {/* Vertical divider on desktop */}
          <div className="hidden md:block absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-white/20" />
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-start md:pl-8">
          <form onSubmit={handleSubmit} className="w-full max-w-[320px] space-y-4 mx-auto">
            
            {/* USN Input */}
            <div className="relative">
              <input
                type="text"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                placeholder="USN"
                className="w-full bg-white/20 border border-white/10 rounded-[2rem] px-6 py-3.5 text-slate-900 placeholder-slate-700 focus:outline-none focus:bg-white/30 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all backdrop-blur-sm text-sm tracking-wider"
              />
              {errors.usn && <p className="text-red-400 text-xs mt-2 ml-4 font-semibold">{errors.usn}</p>}
            </div>

            {/* Name Input */}
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="NAME"
                className="w-full bg-white/20 border border-white/10 rounded-[2rem] px-6 py-3.5 text-slate-900 placeholder-slate-700 focus:outline-none focus:bg-white/30 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all backdrop-blur-sm text-sm tracking-wider"
              />
              {errors.fullName && <p className="text-red-400 text-xs mt-2 ml-4 font-semibold">{errors.fullName}</p>}
            </div>

            {/* Year Buttons */}
            <div className="flex justify-between gap-4 ">
              <button
                type="button"
                onClick={() => setIsSecondYear(false)}
                className={cn(
                  "flex-1 py-3 rounded-[2rem] text-sm tracking-wider transition-all backdrop-blur-sm",
                  !isSecondYear 
                    ? "bg-white/30 text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/40" 
                    : "bg-white/5 text-slate-800 border border-white/10 hover:bg-white/10"
                )}
              >
                <span className="year-toggle-label">1ST YEAR</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSecondYear(true)}
                className={cn(
                  "flex-1 py-3 rounded-[2rem] text-sm tracking-wider transition-all backdrop-blur-sm",
                  isSecondYear 
                    ? "bg-white/30 text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/40" 
                    : "bg-white/5 text-slate-800 border border-white/10 hover:bg-white/10"
                )}
              >
                <span className="year-toggle-label">2ND YEAR</span>
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-6 flex justify-center w-full">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-[150px] transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:grayscale flex items-center justify-center"
              >
                <div className="relative w-full h-full scale-125">
                  <Image
                    src="/assets/startbutton.png"
                    alt="Begin Adventure"
                    fill
                    className="object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.4)]"
                  />
                  {loading && (
                    <span className="absolute inset-0 flex items-center justify-center text-[#3e2413] font-black tracking-widest uppercase text-sm">
                      {/* Enlisting... */}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {errors.api && (
              <div className="text-red-300 text-center text-sm bg-red-900/40 p-3 rounded-xl border border-red-500/30 backdrop-blur-md font-semibold">
                {errors.api}
              </div>
            )}
            
          </form>
        </div>
      </div>
    </div>
  );
}
