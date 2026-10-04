"use client";

import { useState } from "react";
import Link from "next/link"; 
import { createClient } from "@supabase/supabase-js";
import rawStationData from "../data/questions.json"; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Card {
  qA: string;
  aA: string;
  qB: string;
  aB: string;
}

const stationData: Record<string, Card[]> = rawStationData;
const availableStations = Object.keys(stationData);

export default function TreasureStation() {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [step, setStep] = useState<"login" | "questions">("login");
  const [guestCode, setGuestCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [playedGuests, setPlayedGuests] = useState<Set<string>>(new Set());
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showAnswerA, setShowAnswerA] = useState(false);
  const [showAnswerB, setShowAnswerB] = useState(false);

  const handleBackToStations = () => {
    setActiveStation(null);
    setStep("login");
    setGuestCode("");
    setCurrentCard(null);
    setErrorMsg("");
  };

  const handleSelectStation = async (stationName: string) => {
    setIsLoading(true);
    setActiveStation(stationName);
    setAvailableCards([...stationData[stationName]]); 
    
    const { data, error } = await supabase
      .from("station_guests")
      .select("guest_code")
      .eq("station_name", stationName);
      
    if (data) {
      const existingGuests = new Set(data.map(row => row.guest_code));
      setPlayedGuests(existingGuests);
    }
    setIsLoading(false);
  };

  const startQuestions = () => {
    const rawCode = guestCode.trim();
    
    if (!rawCode) {
      setErrorMsg("Please enter a guest ID.");
      return;
    }

    const codeNum = parseInt(rawCode, 10);
    if (isNaN(codeNum) || codeNum < 1 || codeNum > 75) {
      setErrorMsg("❌ Invalid code! Enter a number from 001 to 075.");
      return;
    }

    const standardizedCode = String(codeNum).padStart(3, "0");
    setGuestCode(standardizedCode); 

    if (playedGuests.has(standardizedCode)) {
      setErrorMsg("🚨 Stop! This guest already played here.");
      return;
    }
    if (availableCards.length < 1) {
      setErrorMsg("⚠️ Out of question cards!");
      return;
    }

    const pool = [...availableCards];
    const idx = Math.floor(Math.random() * pool.length);
    const drawnCard = pool.splice(idx, 1)[0];

    setAvailableCards(pool);
    setCurrentCard(drawnCard);
    setErrorMsg("");
    setShowAnswerA(false);
    setShowAnswerB(false);
    setStep("questions");
  };

  const handleResult = async (isCorrect: boolean) => {
    setIsLoading(true);
    const finalCode = guestCode;

    const { error } = await supabase
      .from("station_guests")
      .insert([
        {
          station_name: activeStation,
          guest_code: finalCode,
          is_correct: isCorrect
        }
      ]);

    if (error) {
      alert("Error saving data. Please check your connection.");
      setIsLoading(false);
      return;
    }

    setPlayedGuests(new Set(playedGuests).add(finalCode));

    if (isCorrect) {
      alert("🎉 CORRECT! Please Punch their card!");
    } else {
      alert("❌ INCORRECT. Do not give a Punch.");
    }

    setGuestCode("");
    setStep("login");
    setIsLoading(false);
  };

  if (!activeStation) {
    return (
      <main className="min-h-[100dvh] bg-[#fdfbf7] text-stone-800 flex flex-col items-center justify-center p-3 font-serif">
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#8b5a2b] mb-1">
            Treasure Station
          </h1>
          <p className="italic text-xs sm:text-sm text-stone-500">Volunteer Setup</p>
        </div>
        
        <div className="bg-white border border-[#f0e6d2] shadow-sm rounded-xl p-4 w-full max-w-sm text-center">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Your Station</h2>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto px-1">
            {availableStations.map((stationName) => (
              <button
                key={stationName}
                onClick={() => handleSelectStation(stationName)}
                disabled={isLoading}
                className="bg-[#8b5a2b] hover:bg-[#704822] text-white text-sm sm:text-base font-semibold py-2.5 px-4 rounded-lg transition-colors w-full disabled:opacity-50"
              >
                {isLoading ? "Loading..." : stationName}
              </button>
            ))}
          </div>
          
          {/* ✅ ADMIN ACCESS LINK VISIBLE AGAIN */}
          <div className="mt-6 pt-4 border-t border-stone-100">
            <Link 
              href="/admin" 
              className="text-xs text-stone-400 hover:text-[#8b5a2b] underline transition-colors"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#fdfbf7] text-stone-800 flex flex-col items-center justify-center p-2 sm:p-4 font-serif relative">
      
      <button 
        onClick={handleBackToStations}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-stone-400 hover:text-[#8b5a2b] flex items-center gap-1 text-sm font-sans transition-colors font-semibold"
      >
        ← Change Station
      </button>

      <div className="text-center mb-2 sm:mb-4 mt-8 sm:mt-0">
        <h1 className="text-xl sm:text-2xl font-bold text-[#8b5a2b] mb-0.5">{activeStation}</h1>
        <p className="italic text-xs text-stone-500">Dashboard ({availableCards.length} cards left)</p>
      </div>

      {step === "login" && (
        <div className="bg-white border border-[#f0e6d2] shadow-sm rounded-xl p-4 sm:p-6 w-full max-w-sm text-center">
          <h2 className="text-base sm:text-lg font-semibold mb-3">Enter Guest Card Code</h2>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={guestCode}
            onChange={(e) => setGuestCode(e.target.value)}
            placeholder="e.g. - 042"
            className="w-full p-2.5 text-center text-lg font-bold border-2 border-stone-200 rounded-lg mb-3 focus:outline-none focus:border-[#8b5a2b]"
            onKeyDown={(e) => e.key === 'Enter' && startQuestions()}
          />
          <button
            onClick={startQuestions}
            className="w-full bg-[#8b5a2b] hover:bg-[#704822] text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm sm:text-base"
          >
            Draw Card
          </button>
          {errorMsg && <p className="text-red-600 mt-2 text-sm font-semibold">{errorMsg}</p>}
        </div>
      )}

      {step === "questions" && currentCard && (
        <div className="bg-white border border-[#f0e6d2] shadow-sm rounded-xl p-3 sm:p-5 w-full max-w-md flex flex-col gap-2 sm:gap-3">
          
          <div className="flex justify-between items-center border-b pb-1 sm:pb-2">
            <h2 className="text-base sm:text-lg">
              Guest: <span className="font-bold text-[#8b5a2b]">{guestCode}</span>
            </h2>
            <span className="text-[10px] sm:text-xs text-stone-400 font-sans px-1.5 py-0.5 bg-stone-100 rounded">Ask A or B</span>
          </div>

          <div className="bg-stone-50 p-2 sm:p-3 rounded-lg border-l-4 border-[#8b5a2b]">
            <p className="font-bold mb-0.5 text-xs sm:text-sm">Question A:</p>
            <p className="mb-1.5 text-xs sm:text-sm leading-tight">{currentCard.qA}</p>
            <button 
              onClick={() => setShowAnswerA(!showAnswerA)}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] sm:text-xs font-semibold py-1 px-2 rounded transition-colors"
            >
              {showAnswerA ? "Hide Answer" : "Reveal Answer"}
            </button>
            {showAnswerA && <p className="text-[#8b5a2b] font-bold text-sm sm:text-base border-t border-stone-200 pt-1 mt-1.5">Answer: {currentCard.aA}</p>}
          </div>

          <div className="text-center font-bold text-stone-400 text-xs sm:text-sm my-0">OR</div>

          <div className="bg-stone-50 p-2 sm:p-3 rounded-lg border-l-4 border-[#8b5a2b]">
            <p className="font-bold mb-0.5 text-xs sm:text-sm">Question B:</p>
            <p className="mb-1.5 text-xs sm:text-sm leading-tight">{currentCard.qB}</p>
            <button 
              onClick={() => setShowAnswerB(!showAnswerB)}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] sm:text-xs font-semibold py-1 px-2 rounded transition-colors"
            >
              {showAnswerB ? "Hide Answer" : "Reveal Answer"}
            </button>
            {showAnswerB && <p className="text-[#8b5a2b] font-bold text-sm sm:text-base border-t border-stone-200 pt-1 mt-1.5">Answer: {currentCard.aB}</p>}
          </div>

          <div className="mt-1">
            <h3 className="font-semibold text-center mb-1.5 text-xs sm:text-sm">Did they answer correctly?</h3>
            <div className="flex flex-row gap-2">
              <button
                disabled={isLoading}
                onClick={() => handleResult(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs sm:text-sm disabled:opacity-50"
              >
                ✅ YES
              </button>
              <button
                disabled={isLoading}
                onClick={() => handleResult(false)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-xs sm:text-sm disabled:opacity-50"
              >
                ❌ NO
              </button>
            </div>
          </div>

        </div>
      )}
    </main>
  );
}