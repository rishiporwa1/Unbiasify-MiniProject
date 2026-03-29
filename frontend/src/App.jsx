import { useState } from "react";
import axios from "axios";
import LiquidEther from "./components/LiquidEther";
import ScrollVelocity from './components/ScrollVelocity';

export default function App() {

  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeText = async () => {
    if (!text.trim()) return;

    setLoading(true);

    const res = await axios.post(
      "http://127.0.0.1:8000/api/analyze/",
      { text }
    );

    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-hidden">

      {/* LIQUID BACKGROUND */}
      <div className="absolute inset-0 -z-10 w-full h-full">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
        />
      </div>

      {/* NAVBAR */}
      <nav className="
      fixed top-6 left-1/2 -translate-x-1/2
      bg-white/10 backdrop-blur-xl
      border border-white/20
      px-8 py-3 rounded-full
      flex items-center gap-10
      shadow-[0_8px_30px_rgba(0,0,0,0.6)]
      z-50">

        <div className="font-semibold"> Unbiasify</div>

        <div className="flex gap-6 text-sm">
          <a href="#" className="hover:text-purple-300 transition">Home</a>
          <a href="#" className="hover:text-purple-300 transition">Docs</a>
        </div>

      </nav>

      {/* HERO */}
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4">

        {/* BADGE */}
        {/* <div className="
        mb-6 px-4 py-2
        rounded-full
        bg-white/10 backdrop-blur-xl
        border border-white/20
        text-sm">
          ✦ New Background
        </div> */}
        {/* TITLE */}
        <h1 className="
        text-6xl font-bold mb-10
        drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
          <span className="text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]">
            Unbiasify
          </span>
        {/* <ScrollVelocity
          texts={['Detect Bias in Text Using AI']} 
          velocity={10}
          className="custom-scroll-text"
        /> */}
        </h1>

        {/* ANALYZER CARD */}
        <div className="
        bg-white/10 backdrop-blur-xl
        border border-white/20
        p-8 rounded-2xl
        shadow-[0_20px_60px_rgba(0,0,0,0.6)]
        w-[520px]">

          <textarea
            className="
            w-full p-4 rounded-lg
            bg-black/30
            border border-white/20
            text-white
            placeholder-white/50
            focus:outline-none
            focus:ring-2 focus:ring-purple-400"
            rows="5"
            placeholder="Paste text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* ANALYZE BUTTON */}
          <button
            onClick={analyzeText}
            className="
            w-full mt-5
            px-6 py-3
            rounded-full
            bg-white text-black
            font-medium
            hover:bg-white/90
            transition
            shadow-lg"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {/* RESULT */}
          {result && (
            <div className="mt-6 text-center text-white">
              <p><b>Sentiment:</b> {result.sentiment}</p>
              <p><b>Polarity:</b> {result.polarity}</p>
            </div>
          )}

        </div>

      </div>

      {/* FOOTER */}
      <footer className="
        w-full py-6
        bg-black/40
        backdrop-blur-xl
        border-t border-white/10
        text-center text-white/60
        text-sm">

        AI Bias Detection • 2026 • Built with React + Django

      </footer>

    </div>
  );
}