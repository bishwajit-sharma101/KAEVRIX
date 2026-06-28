"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const AppClient = dynamic(() => import("./AppClient"), {
  ssr: false,
});

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <AppClient />;
}
