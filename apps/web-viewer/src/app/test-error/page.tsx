"use client";

import { useEffect } from "react";

export default function TestErrorPage() {
  useEffect(() => {
    // This will fire a client-side exception shortly after the component mounts
    setTimeout(() => {
      throw new Error("Antigravity Test Error: Sentry Client Side Tracking is working!");
    }, 500);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-[#0f1218] text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-[#5b9cf8]">Firing Test Error...</h1>
        <p className="text-gray-400">Check your Sentry dashboard in a few seconds.</p>
      </div>
    </div>
  );
}
