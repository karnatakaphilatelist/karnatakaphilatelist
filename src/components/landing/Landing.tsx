"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import "./landing.css";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { CONTACT_EMAIL, DISCLAIMER } from "@/lib/constants";
import {
  cardProgress,
  formatCounter,
  INTRO_SEEN_KEY,
  projectPins,
  scrollProgress,
  SPLIT_AT,
  SPLIT_DURATION_MS,
} from "@/lib/landing";
import { getFirstName } from "@/lib/user-display";
import type { PostOffice } from "@/types";

const STEPS = [
  {
    n: 1,
    title: "Find",
    text: "Search or browse the map to spot post offices near you.",
  },
  {
    n: 2,
    title: "Visit",
    text: "Go there. Plan your route and tick it off as you travel.",
  },
  {
    n: 3,
    title: "Stamp",
    text: "Get your passport stamped and mark it visited to fill your collection.",
  },
];

type IntroState = "playing" | "open" | "done";

function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberIntro(): void {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Without storage the intro simply plays again next time.
  }
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
 * The front door: a postcard posts itself into a post box, the page splits open, and
 * scrolling grows the map card until it fills the screen. Plays once per browser
 * session (never for people who ask for reduced motion) and can be skipped.
 */
export function Landing({ offices }: { offices: PostOffice[] }) {
  const { user, isLoading, openSignIn, signOut } = useAuth();
  const { visits } = useVisits();

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const solidRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => undefined);
  const [introState, setIntroState] = useState<IntroState>("playing");
  const [revealed, setRevealed] = useState(false);
  const [clock, setClock] = useState("--:--:--");

  const pins = useMemo(() => projectPins(offices), [offices]);
  const total = offices.length;
  const stamped = Object.keys(visits).length;
  // Until someone has a stamp of their own, show an example so the card still makes sense.
  const isSample = stamped === 0;
  const shownStamped = isSample ? 12 : stamped;
  const firstName = user ? getFirstName(user) : null;

  // The intro: runs once per session, skipped when motion is reduced or it was already seen.
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || hasSeenIntro()) {
      // Mounting is the only moment we can learn this (it needs browser APIs).
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      html.removeAttribute("data-intro-playing");
      rememberIntro();
      setIntroState("done");
      setRevealed(true);
    };
    skipRef.current = finish;

    introRef.current?.setAttribute("data-go", "");
    const start = performance.now();
    let opened = false;
    const tick = (now: number) => {
      const seconds = (now - start) / 1000;
      const progress = cardProgress(seconds);
      const travel = Math.max(0, window.innerWidth - 110);
      const card = cardRef.current;
      if (card) {
        card.style.opacity = seconds > 0.4 && progress < 1 ? "1" : "0";
        card.style.transform = `translateX(${progress * travel}px) rotate(${-6 + progress * 6}deg)`;
      }
      if (solidRef.current) {
        solidRef.current.style.width =
          progress >= 1 ? "100%" : `${progress * travel + 30}px`;
      }
      if (countRef.current)
        countRef.current.textContent = formatCounter(progress, total);

      if (seconds >= SPLIT_AT && !opened) {
        opened = true;
        setIntroState("open");
        timers.push(
          setTimeout(() => setRevealed(true), SPLIT_DURATION_MS * 0.55),
        );
        timers.push(setTimeout(finish, SPLIT_DURATION_MS));
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      finished = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      html.removeAttribute("data-intro-playing");
    };
  }, [total]);

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

  // The map card opens in step with the scroll, so its speed follows the person's hand.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scroller = scrollerRef.current;
      const root = rootRef.current;
      if (!scroller || !root) return;
      const max = scroller.offsetHeight - window.innerHeight;
      const p = scrollProgress(window.scrollY, max, 0.92);
      root.style.setProperty("--p", p.toFixed(4));

      // Which card is currently at the left edge, for the arrows and the progress ticks.
      const track = trackRef.current;
      if (track) {
        const cards = Array.from(track.children) as HTMLElement[];
        const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        const shift = p * Math.max(0, track.offsetWidth - window.innerWidth);
        let current = 0;
        cards.forEach((card, i) => {
          if (card.offsetLeft - pad <= shift + 40) current = i;
        });
        setCardCount(cards.length);
        // Without a layout (for example before styles load) keep the first card selected.
        setCardIndex(track.offsetWidth > 0 ? current : 0);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /** Scrolls the page so that card `index` sits at the left edge (works backwards too). */
  const goToCard = (index: number) => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const target = cards[Math.max(0, Math.min(cards.length - 1, index))];
    if (!target) return;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const span = Math.max(1, track.offsetWidth - window.innerWidth);
    const p = Math.max(0, Math.min(1, (target.offsetLeft - pad) / span));
    const max = scroller.offsetHeight - window.innerHeight;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: p * max * 0.92,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <div ref={rootRef} className={`kpl${revealed ? " in" : ""}`}>
      <noscript>
        <style>{".kpl-intro{display:none}"}</style>
      </noscript>

      <div ref={scrollerRef} className="kpl-scroller">
        <div className="kpl-stage">
          <Wordmark />
          <div className="kpl-row">
            <p className="kpl-meta kpl-sub">Karnataka philatelic passport</p>
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
          <p className="kpl-meta kpl-mono kpl-time">Local time {clock} (IST)</p>
          <p className="kpl-meta kpl-mono kpl-open">
            <span className="kpl-dot" />
            {total} post offices
          </p>

          <div ref={trackRef} className="kpl-track">
            <article className="kpl-card kpl-card--hero">
              <header className="kpl-cardhead">
                <span>01</span>
                <span>Welcome</span>
              </header>
              <div className="kpl-herobody">
                <div className="kpl-hero-copy">
                  <h1>
                    Collect a stamp from every post office in Karnataka,{" "}
                    <span>one stamp</span> at a time.
                  </h1>
                  <p>
                    Find the {total} post offices of the Karnataka philatelic
                    passport, visit them and keep every stamp in one place.
                  </p>
                  <div className="kpl-btns">
                    <Link href="/explore" className="kpl-btn kpl-btn--red">
                      Open the map
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
                        stroke="#1c2b6b"
                        strokeWidth="2"
                      />
                      <path
                        d="M25 90 L45 55 L62 78 L75 62 L95 90 Z"
                        fill="#1c2b6b"
                      />
                      <circle cx="80" cy="34" r="9" fill="#cf1830" />
                      <text
                        x="60"
                        y="132"
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="700"
                        fill="#1c2b6b"
                      >
                        KARNATAKA
                      </text>
                      <text
                        x="60"
                        y="145"
                        textAnchor="middle"
                        fontSize="9"
                        fill="#1c2b6b"
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
                      stroke="#1c2b6b"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#1c2b6b"
                      strokeWidth="1.5"
                    />
                    <text
                      x="50"
                      y="46"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#1c2b6b"
                    >
                      BENGALURU
                    </text>
                    <text
                      x="50"
                      y="60"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#1c2b6b"
                    >
                      STAMPED
                    </text>
                  </svg>
                </div>
              </div>
            </article>

            <article className="kpl-card kpl-card--progress">
              <header className="kpl-cardhead">
                <span>02</span>
                <span>Progress</span>
              </header>
              <p className="kpl-kicker">
                {firstName ? `Namaskara, ${firstName}` : "Your passport"}
              </p>
              <p className="kpl-big">
                <b>{shownStamped}</b> of {total} stamped
              </p>
              <div
                className="kpl-bar"
                role="progressbar"
                aria-label="Stamps collected"
                aria-valuenow={shownStamped}
                aria-valuemin={0}
                aria-valuemax={total}
              >
                <i
                  style={{
                    width: `${Math.round((shownStamped / Math.max(total, 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="kpl-note">
                {isSample
                  ? "An example. Your own count appears here once you start collecting."
                  : `${total - shownStamped} to go. Keep going.`}
              </p>
            </article>

            {STEPS.map((step) => (
              <article key={step.title} className="kpl-card kpl-card--step">
                <header className="kpl-cardhead">
                  <span>{String(step.n + 2).padStart(2, "0")}</span>
                  <span>Step {step.n} of 3</span>
                </header>
                <span className="kpl-bignum" aria-hidden="true">
                  {step.n}
                </span>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
              </article>
            ))}

            <article
              className="kpl-card kpl-card--map"
              aria-label="Preview of the map"
            >
              <div className="kpl-minimap" aria-hidden="true">
                {pins.map((pin) => (
                  <i
                    key={pin.id}
                    className={`kpl-pin${visits[pin.id] ? " kpl-pin--v" : ""}`}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  />
                ))}
              </div>
              <p className="kpl-note">
                Every post office, pinned across Karnataka.
              </p>
            </article>

            <article className="kpl-card kpl-card--foot">
              <header className="kpl-cardhead">
                <span>07</span>
                <span>Good to know</span>
              </header>
              <p className="kpl-fine">{DISCLAIMER}</p>
              <p className="kpl-links">
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
              </p>
            </article>
          </div>

          <div className="kpl-dock">
            <div className="kpl-ticks" role="group" aria-label="Cards">
              {Array.from({ length: cardCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to card ${i + 1} of ${cardCount}`}
                  aria-current={i === cardIndex ? "true" : undefined}
                  className={i === cardIndex ? "on" : ""}
                  onClick={() => goToCard(i)}
                />
              ))}
            </div>
            <div className="kpl-dockrow">
              <button
                type="button"
                className="kpl-arrow"
                aria-label="Previous card"
                disabled={cardIndex <= 0}
                onClick={() => goToCard(cardIndex - 1)}
              >
                <ArrowLeftIcon />
              </button>
              <Link href="/explore" className="kpl-open-map">
                Open the map
                <ArrowRightIcon />
              </Link>
              <button
                type="button"
                className="kpl-arrow"
                aria-label="Next card"
                disabled={cardCount > 0 && cardIndex >= cardCount - 1}
                onClick={() => goToCard(cardIndex + 1)}
              >
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={introRef}
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
          <div ref={solidRef} className="kpl-solid" />
          <div ref={countRef} className="kpl-mono kpl-count">
            000
          </div>
          <div className="kpl-mono kpl-hint">Post here &raquo;</div>
          <div className="kpl-postbox">
            <svg viewBox="0 0 44 64" width="44" height="64">
              <rect x="4" y="6" width="36" height="56" rx="4" fill="#fbf5e9" />
              <rect
                x="8"
                y="14"
                width="28"
                height="5"
                rx="2.5"
                fill="#1c2b6b"
              />
              <rect x="14" y="30" width="16" height="3" fill="#cf1830" />
              <rect x="0" y="2" width="44" height="8" rx="4" fill="#fbf5e9" />
            </svg>
          </div>
          <div ref={cardRef} className="kpl-flycard" />
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
