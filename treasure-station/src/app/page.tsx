"use client";

import { useState } from "react";
import rawStationData from "../data/questions.json"; 

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
  
  const [showAnswerA, setShowAnswerA] = useState(false);
  const [showAnswerB, setShowAnswerB] = useState(false);

  const handleSelectStation = (stationName: string) => {
    setActiveStation(stationName);
    setAvailableCards([...stationData[stationName]]); 
  };

  const startQuestions = () => {
    const rawCode = guestCode.trim();
    
    if (!rawCode) {
      setErrorMsg("Please enter a guest code.");
      return;
    }

    // --- NEW STRICT NUMBER VALIDATION ---
    const codeNum = parseInt(rawCode, 10);
    if (isNaN(codeNum) || codeNum < 1 || codeNum > 75) {
      setErrorMsg("❌ Invalid code! Enter a number from 001 to 075.");
      return;
    }

    // Standardize to a 3-digit string (turns "5" into "005")
    const standardizedCode = String(codeNum).padStart(3, "0");
    setGuestCode(standardizedCode); // Update input field to show formatted code

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

  const handleResult = (isCorrect: boolean) => {
    // Uses the correctly formatted code (e.g., "042")
    setPlayedGuests(new Set(playedGuests).add(guestCode));

    if (isCorrect) {
      alert("🎉 CORRECT! Please STAMP their card!");
    } else {
      alert("❌ INCORRECT. Do not give a stamp.");
    }

    setGuestCode("");
    setStep("login");
  };

  // --- UI: RENDER STATION SELECTOR FIRST ---
  if (!activeStation) {
    return (
      <main className="min-h-[100dvh] bg-[#fdfbf7] text-stone-800 flex flex-col items-center justify-center p-3 font-serif">
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#8b5a2b] mb-1">💍 Treasure Station</h1>
          <p className="italic text-xs sm:text-sm text-stone-500">Volunteer Setup</p>
        </div>
        <div className="bg-white border border-[#f0e6d2] shadow-sm rounded-xl p-4 w-full max-w-sm text-center">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Your Station</h2>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto px-1">
            {availableStations.map((stationName) => (
              <button
                key={stationName}
                onClick={() => handleSelectStation(stationName)}
                className="bg-[#8b5a2b] hover:bg-[#704822] text-white text-sm sm:text-base font-semibold py-2.5 px-4 rounded-lg transition-colors w-full"
              >
                {stationName}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // --- UI: RENDER MAIN DASHBOARD ONCE STATION IS SELECTED ---
  return (
    <main className="min-h-[100dvh] bg-[#fdfbf7] text-stone-800 flex flex-col items-center justify-center p-2 sm:p-4 font-serif">
      <div className="text-center mb-2 sm:mb-4">
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
            placeholder="e.g., 042"
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

          {/* QUESTION A BOX */}
          <div className="bg-stone-50 p-2 sm:p-3 rounded-lg border-l-4 border-[#8b5a2b]">
            <p className="font-bold mb-0.5 text-xs sm:text-sm">Question A:</p>
            <p className="mb-1.5 text-xs sm:text-sm leading-tight">{currentCard.qA}</p>
            
            <button 
              onClick={() => setShowAnswerA(!showAnswerA)}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] sm:text-xs font-semibold py-1 px-2 rounded transition-colors"
            >
              {showAnswerA ? "Hide Answer" : "Reveal Answer"}
            </button>
            
            {showAnswerA && (
              <p className="text-[#8b5a2b] font-bold text-sm sm:text-base border-t border-stone-200 pt-1 mt-1.5">
                Answer: {currentCard.aA}
              </p>
            )}
          </div>

          <div className="text-center font-bold text-stone-400 text-xs sm:text-sm my-0">OR</div>

          {/* QUESTION B BOX */}
          <div className="bg-stone-50 p-2 sm:p-3 rounded-lg border-l-4 border-[#8b5a2b]">
            <p className="font-bold mb-0.5 text-xs sm:text-sm">Question B:</p>
            <p className="mb-1.5 text-xs sm:text-sm leading-tight">{currentCard.qB}</p>
            
            <button 
              onClick={() => setShowAnswerB(!showAnswerB)}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] sm:text-xs font-semibold py-1 px-2 rounded transition-colors"
            >
              {showAnswerB ? "Hide Answer" : "Reveal Answer"}
            </button>
            
            {showAnswerB && (
              <p className="text-[#8b5a2b] font-bold text-sm sm:text-base border-t border-stone-200 pt-1 mt-1.5">
                Answer: {currentCard.aB}
              </p>
            )}
          </div>

          {/* RESULTS BUTTONS */}
          <div className="mt-1">
            <h3 className="font-semibold text-center mb-1.5 text-xs sm:text-sm">Did they answer correctly?</h3>
            <div className="flex flex-row gap-2">
              <button
                onClick={() => handleResult(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs sm:text-sm"
              >
                ✅ YES
              </button>
              <button
                onClick={() => handleResult(false)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-xs sm:text-sm"
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