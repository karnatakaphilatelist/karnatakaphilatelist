"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./landing.css";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { isNativeApp } from "@/lib/native";
import { readJson } from "@/lib/local-storage";
import { useStateOffices } from "@/components/providers/StateProvider";
import { stateName } from "@/lib/states";
import { useVisits } from "@/components/providers/VisitsProvider";
import {
  CONTACT_EMAIL,
  DISCLAIMER,
  ONBOARDED_KEY,
  PLAY_STORE_LIVE,
  PLAY_STORE_URL,
} from "@/lib/constants";
import {
  cardProgress,
  formatCounter,
  INTRO_PLAYED_FLAG,
  SKIP_INTRO_COOKIE,
  SPLIT_AT,
  SPLIT_DURATION_MS,
} from "@/lib/landing";
import { getFirstName } from "@/lib/user-display";
import { greetingWord } from "@/lib/states";
import type { PostOffice } from "@/types";

const SKIP_COOKIE = new RegExp(`(?:^|; )${SKIP_INTRO_COOKIE}=1`);

type IntroState = "playing" | "open" | "done";

/** The intro plays on every fresh load, but not twice in one load or straight after signing in. */
function hasSeenIntro(): boolean {
  const flagged = (window as unknown as Record<string, unknown>)[
    INTRO_PLAYED_FLAG
  ];
  return (
    flagged === true ||
    SKIP_COOKIE.test(document.cookie) ||
    // Lite mode (chosen, or switched on for older phones) plays no intro.
    document.documentElement.hasAttribute("data-lite")
  );
}

function rememberIntro(): void {
  (window as unknown as Record<string, unknown>)[INTRO_PLAYED_FLAG] = true;
}

/** The wordmark in white (on the red intro) or red (on the page), as one line or stacked on phones. */
function Wordmark({ white = false }: { white?: boolean }) {
  return (
    <>
      <div
        className={`kpl-wm${white ? " kpl-wm--white" : ""}`}
        aria-hidden="true"
      />
      <div
        className={`kpl-wm-stack${white ? " kpl-wm-stack--white" : ""}`}
        aria-hidden="true"
      >
        <i />
        <i />
      </div>
    </>
  );
}

/**
 * The front door: a postcard posts itself into a post box, the page splits open, and the
 * real masthead is revealed in exactly the spot the intro's wordmark was. Plays once per
 * browser session (never for people who ask for reduced motion) and can be skipped.
 */

export function Landing({ offices }: { offices: PostOffice[] }) {
  const { user, isLoading, openSignIn, signOut } = useAuth();
  const { visits } = useVisits();

  const countRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => undefined);
  const [introState, setIntroState] = useState<IntroState>("playing");
  const [revealed, setRevealed] = useState(false);
  const [clock, setClock] = useState("--:--:--");

  const total = offices.length;
  const { stateCode, stateOffices } = useStateOffices(offices);
  const stateTotal = stateOffices.length;
  const stateName_ = stateName(stateCode);
  const liveCount = new Set(offices.map((office) => office.state)).size;
  const stamped = stateOffices.filter((office) => visits[office.id]).length;
  // Until someone has a postmark of their own, show an example so the card still makes sense.
  const isSample = stamped === 0;
  const shownStamped = isSample ? Math.min(12, stateTotal) : stamped;
  const firstName = user ? getFirstName(user) : null;
  const greeting = greetingWord(stateCode);

  const STEPS = [
    {
      n: 1,
      title: "Find",
      text: `Pick a post office from ${stateName_}'s ${stateTotal}-office list.`,
    },
    {
      n: 2,
      title: "Go there",
      text: "Travel there in person. The trip is the point.",
    },
    {
      n: 3,
      title: "Check in",
      text: "The app confirms you're actually there before you log it.",
    },
    {
      n: 4,
      title: "Get stamped",
      text: "Counter staff postmark your passport — mark it collected and move on.",
    },
  ];

  // In the mobile apps the very first launch plays the intro and then shows the welcome tour;
  // every launch after that opens straight on the map.
  const afterIntro = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!isNativeApp()) return;
    const tour = new URLSearchParams(window.location.search).has("tour");
    const seen = readJson<boolean>(ONBOARDED_KEY, false);
    if (seen || tour) {
      const target = seen && !tour ? "/explore" : "/welcome";
      // A full navigation, because the client router has been seen to stall on this page inside the app.
      window.location.replace(target);
      return;
    }
    // First launch: the intro hands over to the tour when it ends (or when it is skipped).
    afterIntro.current = () => window.location.replace("/welcome");
    const fallback = setTimeout(
      () => window.location.replace("/welcome"),
      9000
    );
    return () => clearTimeout(fallback);
  }, []);

  // The intro: runs once per session, skipped when motion is reduced or it was already seen.
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced || hasSeenIntro()) {
      // Mounting is the only moment we can learn this (it needs browser APIs).
      if (afterIntro.current) {
        afterIntro.current();
        return;
      }
      setIntroState("done");
      setRevealed(true);
      return;
    }

    const html = document.documentElement;
    html.setAttribute("data-intro-playing", "");
    const timers: ReturnType<typeof setTimeout>[] = [];
    let frame = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      rememberIntro();
      // First app launch: leave for the tour without ever showing the page behind the intro. The flag from
      // the <head> script is the backstop for a web view where Capacitor itself cannot be reached.
      const leave =
        afterIntro.current ??
        ((window as unknown as { __kpApp?: boolean }).__kpApp
          ? () => window.location.replace("/welcome")
          : null);
      if (leave) {
        leave();
        return;
      }
      html.removeAttribute("data-intro-playing");
      setIntroState("done");
      setRevealed(true);
    };
    skipRef.current = finish;

    // The CSS owns the picture: the card, the line and the split all run from `data-intro-go`, set by the
    // script in <head>. Everything below only counts the number up and hands over at the end, so a slow
    // phone shows exactly the same animation, just with a counter that may join late.
    const earlyStart = (window as unknown as { __kpIntroT0?: number })
      .__kpIntroT0;
    const begun = performance.now();
    const start =
      earlyStart !== undefined && begun - earlyStart < 6000
        ? earlyStart
        : begun;

    const tick = (now: number) => {
      const seconds = (now - start) / 1000;
      if (countRef.current) {
        countRef.current.textContent = formatCounter(
          cardProgress(seconds),
          total
        );
      }
      if (seconds < SPLIT_AT) frame = requestAnimationFrame(tick);
    };
    // The number is written out already finished, so a phone whose code arrives late leaves it alone
    // rather than snapping it backwards mid-flight.
    if ((begun - start) / 1000 < 1) frame = requestAnimationFrame(tick);

    // Hand over on the CSS timeline: the screen splits at SPLIT_AT and has finished opening 1.3s later.
    const elapsed = (performance.now() - start) / 1000;
    const toSplit = Math.max(0, SPLIT_AT - elapsed) * 1000;
    if (
      afterIntro.current ||
      (window as unknown as { __kpApp?: boolean }).__kpApp
    ) {
      // In the app the intro leads to the tour, so there is no page behind it to uncover.
      timers.push(setTimeout(finish, toSplit));
    } else {
      timers.push(
        setTimeout(() => {
          setIntroState("open");
          timers.push(
            setTimeout(() => setRevealed(true), SPLIT_DURATION_MS * 0.55)
          );
          timers.push(setTimeout(finish, SPLIT_DURATION_MS));
        }, toSplit)
      );
    }

    return () => {
      finished = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      html.removeAttribute("data-intro-playing");
    };
  }, [total]);

  // Download the map code quietly once the page has settled, so "Open the map" opens it straight away.
  useEffect(() => {
    const warm = () =>
      void import("@/components/map/OfficeMap").catch(() => undefined);
    if ("requestIdleCallback" in window) {
      const idle = window.requestIdleCallback(warm, { timeout: 6000 });
      return () => window.cancelIdleCallback(idle);
    }
    const timer = setTimeout(warm, 3000);
    return () => clearTimeout(timer);
  }, []);

  // India time, ticking, as a small touch in the corner.
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
    const update = () => setClock(format.format(new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`kpl${revealed ? " in" : ""}`}>
      <noscript>
        <style>{".kpl-intro{display:none}"}</style>
      </noscript>

      {/* Quiet paper grain, so the light background isn't flat. */}
      <svg className="kpl-grain" aria-hidden="true">
        <filter id="kpl-grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#kpl-grain-filter)" />
      </svg>

      <header className="kpl-head">
        <Wordmark />
        <div className="kpl-row">
          <p className="kpl-meta kpl-sub">The philately passport for India</p>
          <nav className="kpl-meta kpl-nav" aria-label="Main">
            <Link href="/explore">Explore</Link>
            <Link href="/passport">Passport</Link>
            {isLoading ? null : user ? (
              <button type="button" onClick={() => void signOut()}>
                Sign out
              </button>
            ) : (
              <button type="button" onClick={() => openSignIn("manual")}>
                Sign in
              </button>
            )}
          </nav>
          <a className="kpl-meta kpl-mail" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="kpl-stats">
          <p className="kpl-meta kpl-mono kpl-time">
            Local time {clock} (IST)
          </p>
          <p className="kpl-meta kpl-mono kpl-open">
            <span className="kpl-dot" />
            {total} post offices
          </p>
        </div>
      </header>

      <main className="kpl-main">
        <section className="kpl-hero">
          <div className="kpl-hero-copy">
            <h1>
              Collect the postmark from every post office in{" "}
              {liveCount > 1
                ? "each state's Philately Passport"
                : `${stateName_}'s Philately Passport`}
              , <span>one post office</span> at a time.
            </h1>
            <p>
              Find post offices on the map, visit them and keep every
              postmark in one place.{" "}
              {liveCount > 1
                ? `${liveCount} states are live.`
                : `${stateName_} is live; more states are on the way.`}
            </p>
            <div className="kpl-btns">
              <Link href="/learn" className="kpl-btn kpl-btn--red">
                See how it works
              </Link>
              <Link href="/passport" className="kpl-btn kpl-btn--line">
                My passport
              </Link>
            </div>
          </div>

          <div className="kpl-coral" aria-hidden="true">
            <div className="kp-perforated kpl-stampart">
              <svg viewBox="0 0 120 150" width="100%" height="100%">
                <rect
                  x="10"
                  y="10"
                  width="100"
                  height="100"
                  fill="#f1e8d3"
                  stroke="#16204f"
                  strokeWidth="2"
                />
                <path d="M25 90 L45 55 L62 78 L75 62 L95 90 Z" fill="#16204f" />
                <circle cx="80" cy="34" r="9" fill="#cf1830" />
                <text
                  x="60"
                  y="132"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="#16204f"
                >
                  {stateName_.toUpperCase()}
                </text>
                <text
                  x="60"
                  y="145"
                  textAnchor="middle"
                  fontSize="9"
                  fill="#16204f"
                >
                  INDIA · POST
                </text>
              </svg>
            </div>
            <svg
              className="kpl-postmark"
              viewBox="0 0 100 100"
              width="96"
              height="96"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#16204f"
                strokeWidth="2.5"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#16204f"
                strokeWidth="1.5"
              />
              <text
                x="50"
                y="46"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#16204f"
              >
                BENGALURU
              </text>
              <text
                x="50"
                y="60"
                textAnchor="middle"
                fontSize="9"
                fill="#16204f"
              >
                STAMPED
              </text>
            </svg>
          </div>
        </section>

        <section className="kpl-highlight">
          <div className="kpl-highlight-copy">
            <p className="kpl-kicker">
              <span>{firstName ? `${greeting}, ${firstName}` : "Your passport"}</span>{" "}
              · {stateName_}
            </p>
            <p className="kpl-big">
              <b>{shownStamped}</b> <span>of {stateTotal} stamped</span>
            </p>
            <div
              className="kpl-bar"
              role="progressbar"
              aria-label="Stamps collected"
              aria-valuenow={shownStamped}
              aria-valuemin={0}
              aria-valuemax={stateTotal}
            >
              <i
                style={{
                  width: `${Math.round(
                    (shownStamped / Math.max(stateTotal, 1)) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="kpl-note">
              {isSample
                ? "An example. Your own count appears here once you start collecting."
                : `${stateTotal - shownStamped} to go. Keep going.`}
            </p>
          </div>

          <Link href="/explore" className="kpl-open-map">
            Open the map
            <ArrowRightIcon />
          </Link>
        </section>

        <section className="kpl-steps">
          <div className="kpl-steps-head">
            <h2>How it works</h2>
            <Link href="/learn" className="kpl-step-link">
              See how it works on Learn &rarr;
            </Link>
          </div>
          <div className="kpl-step-grid">
            {STEPS.map((step) => (
              <div key={step.title}>
                <span className="kpl-step-badge" aria-hidden="true">
                  {step.n}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="kpl-foot">
          <p className="kpl-fine">{DISCLAIMER}</p>
          <p className="kpl-links">
            {PLAY_STORE_LIVE && (
              <a href={PLAY_STORE_URL} rel="noopener">
                Get it on Google Play
              </a>
            )}
            <Link href="/karnataka-philately-passport">The Passport</Link>
            <Link href="/offices">Post offices</Link>
            <Link href="/learn">Guide</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          </p>
        </footer>
      </main>

      <div
        className="kpl-intro"
        data-state={introState}
        aria-hidden={introState === "done"}
      >
        <div className="kpl-top">
          <Wordmark white />
          <div className="kpl-route" />
        </div>
        <div className="kpl-bot">
          <div className="kpl-route" />
          <div className="kpl-dots" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="kpl-fx" aria-hidden="true">
          <div className="kpl-solid" />
          <div ref={countRef} className="kpl-mono kpl-count">
            {formatCounter(1, total)}
          </div>
          <div className="kpl-mono kpl-hint">Post here &raquo;</div>
          <div className="kpl-postbox">
            <svg viewBox="0 0 44 64" width="44" height="64">
              <rect x="4" y="6" width="36" height="56" rx="4" fill="#fcf6e8" />
              <rect
                x="8"
                y="14"
                width="28"
                height="5"
                rx="2.5"
                fill="#16204f"
              />
              <rect x="14" y="30" width="16" height="3" fill="#cf1830" />
              <rect x="0" y="2" width="44" height="8" rx="4" fill="#fcf6e8" />
            </svg>
          </div>
          <div className="kpl-flycard" />
        </div>
        <button
          type="button"
          className="kpl-skip kpl-mono"
          onClick={() => skipRef.current()}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
