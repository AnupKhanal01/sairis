"use client";

import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState<string>("--:--:--");

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }) + " NPT");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <div id="clock">{time}</div>;
}
