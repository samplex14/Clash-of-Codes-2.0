"use client";

import React, { useEffect, useState } from "react";
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
      router.push("/arena");
    } catch (err: any) {
      setErrors({ api: err.message });
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center p-4 relative font-clash overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/assets/newbg.png')",
      }}
    >
      {/* The main glassmorphic container */}
      <div className="relative z-10 w-[95%] max-w-[800px] backdrop-blur-md bg-white/10 border-[1.5px] border-white/20 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row gap-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
        
        {/* Left Side: Title */}
        <div className="flex-none md:flex-1 relative flex items-center justify-center md:justify-start">
          <h1 
            className="text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold text-white/90 text-center md:text-left leading-tight drop-shadow-lg tracking-wide"
            style={{ textShadow: "0 4px 20px rgba(255,255,255,0.4)" }}
          >
            CLASH<br />OF<br />CODES<br />2.0
          </h1>
          {/* Vertical divider on desktop */}
          <div className="hidden md:block absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-white/20" />
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-start md:pl-8">
          <form onSubmit={handleSubmit} className="w-full max-w-[320px] space-y-7 mx-auto">
            
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
            <div className="flex justify-between gap-4 pt-2">
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
            <div className="pt-4 flex justify-center w-full">
              <button
                type="submit"
                disabled={loading}
                className="w-[95%] bg-purple-500 hover:bg-purple-400 text-white font-black tracking-wider px-6 py-4 rounded-[2rem] transition-all shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] disabled:opacity-70 disabled:grayscale uppercase text-sm"
              >
                {loading ? "ENLISTING..." : "BEGIN ADVENTURE"}
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
