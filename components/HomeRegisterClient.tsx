"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingCard from "@/components/LoadingCard";
import { useParticipant } from "@/components/providers/ParticipantProvider";
import { apiRequest } from "@/lib/api";

interface RegisterResponse {
  success: boolean;
  participant: {
    usn: string;
    name: string;
    track: string;
  };
}

const HomeRegisterClient: React.FC = () => {
  const router = useRouter();
  const { login } = useParticipant();

  const [formData, setFormData] = useState<{ usn: string; name: string; year: "1" | "2" }>({
    usn: "",
    name: "",
    year: "1"
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<RegisterResponse>("/api/participants/register", {
        method: "POST",
        json: {
          usn: formData.usn,
          name: formData.name,
          year: Number(formData.year)
        }
      });

      login(response.participant);
      router.push("/arena");
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : "Failed to register to the clan";
      setError(message);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingCard message="Recruiting..." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="card-clash max-w-2xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-clash text-clash-gold drop-shadow-lg mb-4">CLASH OF CODES 2.0</h1>
        <p className="text-xl text-white font-semibold">Prepare for Battle. Code to Survive.</p>
      </div>

      <div className="card-clash max-w-md w-full">
        <h2 className="text-4xl font-clash text-center text-clash-gold mb-2">Join Clan</h2>
        <p className="text-center text-gray-300 font-medium mb-8">Enter your details to prepare for battle.</p>

        {error ? (
          <div className="bg-clash-red/20 border-2 border-clash-red text-white p-3 rounded mb-6 text-center shadow-inner">{error}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-clash-gold font-clash tracking-wide">USN</label>
            <input
              type="text"
              required
              className="input-clash w-full uppercase"
              placeholder="e.g. 1RV21CS001"
              value={formData.usn}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, usn: event.target.value.toUpperCase() }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-clash-gold font-clash tracking-wide">Full Name</label>
            <input
              type="text"
              required
              className="input-clash w-full"
              placeholder="Barbarian King"
              value={formData.name}
              onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-clash-gold font-clash tracking-wide">Year</label>
            <div className="flex gap-4">
              <label
                className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.year === "1"
                    ? "bg-clash-elixir border-purple-900 shadow-inner"
                    : "bg-[#e5e5e5] border-gray-400 text-clash-dark hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="year"
                  value="1"
                  className="hidden"
                  checked={formData.year === "1"}
                  onChange={() => setFormData((previous) => ({ ...previous, year: "1" }))}
                />
                <span className="font-bold">1st Year</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.year === "2"
                    ? "bg-clash-elixir border-purple-900 shadow-inner"
                    : "bg-[#e5e5e5] border-gray-400 text-clash-dark hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="year"
                  value="2"
                  className="hidden"
                  checked={formData.year === "2"}
                  onChange={() => setFormData((previous) => ({ ...previous, year: "2" }))}
                />
                <span className="font-bold">2nd Year</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-clash w-full mt-4 flex items-center justify-center py-4">
            Train Troops
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomeRegisterClient;
