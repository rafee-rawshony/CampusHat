"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>("Checking...");

  useEffect(() => {
    // Quick smoketest to hit the backend health endpoint (mapped in nginx)
    api.get("/health/")
      .then(() => setBackendStatus("Connected 🟢"))
      .catch((err) => {
        console.error(err);
        setBackendStatus("Disconnected 🔴");
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-border bg-gradient-to-b from-card pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-card lg:p-4">
          CampusHat Frontend API Layer&nbsp;
          <code className="font-mono font-bold text-primary">Initialized</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-background via-background lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0 text-muted-foreground">
            Backend Status: <span className="font-bold text-foreground">{backendStatus}</span>
          </div>
        </div>
      </div>

      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-primary before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-secondary after:via-secondary after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-primary before:dark:opacity-10 after:dark:from-secondary after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px] animate-pulse my-32">
        <h1 className="text-6xl font-display font-extrabold tracking-tight text-foreground drop-shadow-sm z-10">
          Campus<span className="text-primary">Hat</span>
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left gap-4">
        {[
          { title: "Marketplace", desc: "Buy, sell, and trade safely within your university." },
          { title: "Mall", desc: "Shop directly from verified student-run businesses." },
          { title: "Chat", desc: "Negotiate securely using our end-to-end encrypted messaging." },
          { title: "Wallet", desc: "Manage fast and secure fiat payments on campus." },
        ].map((item, i) => (
          <div
            key={i}
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-border hover:bg-card/50 hover:dark:border-border hover:dark:bg-card/50"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              {item.title}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none text-primary">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
