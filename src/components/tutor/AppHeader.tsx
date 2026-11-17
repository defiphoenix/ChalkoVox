/**
 * In-app header: brand, Learn / Practice / Explore tabs, account and sign out.
 */
"use client";

import { CircleCheck, Compass, LogOut, Play } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

type Tab = "learn" | "practice" | "explore";

interface AppHeaderProps {
  active: Tab;
  email: string;
  onLearn: () => void;
  onPractice: () => void;
  onExplore: () => void;
}

export function AppHeader({ active, email, onLearn, onPractice, onExplore }: AppHeaderProps) {
  const initial = (email.trim()[0] || "L").toUpperCase();

  return (
    <header className="app-header">
      <Wordmark />

      <nav className="nav-tabs" aria-label="Studio">
        <button
          type="button"
          className={`nav-tab ${active === "learn" ? "active" : ""}`}
          onClick={onLearn}
          aria-current={active === "learn" ? "page" : undefined}
        >
          <Play size={15} />
          <span>Learn</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${active === "practice" ? "active" : ""}`}
          onClick={onPractice}
          aria-current={active === "practice" ? "page" : undefined}
        >
          <CircleCheck size={15} />
          <span>Practice</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${active === "explore" ? "active" : ""}`}
          onClick={onExplore}
          aria-current={active === "explore" ? "page" : undefined}
        >
          <Compass size={15} />
          <span>Explore</span>
        </button>
      </nav>

      <div className="header-right">
        <div className="header-user" title={email}>
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="header-user-email">{email}</span>
        </div>
        <form action="/auth/signout" method="post">
          <button className="icon-btn" type="submit" title="Sign out" aria-label="Sign out">
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </header>
  );
}
