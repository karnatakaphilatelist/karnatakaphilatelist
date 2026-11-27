"use client";

import { useEffect, useState, type ReactNode } from "react";
import { counterStatus, type CounterState, type CounterStatus } from "@/lib/counter-hours";
import Link from "next/link";
import { StampThumb } from "@/components/office/StampThumb";
import { StatusBadge } from "@/components/office/StatusBadge";
import { ContributeSheet } from "@/components/contribute/ContributeSheet";
import { useToast } from "@/components/providers/ToastProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import {
  CheckIcon,
  CloseIcon,
  FlagIcon,
  AlertIcon,
  NavigationIcon,
  TargetIcon,
  ShareIcon,
  NoteIcon,
  GlobeIcon,
} from "@/components/ui/icons";
import {
  directionsUrl,
  formatDistance,
  formatShortDistance,
  proximity,
} from "@/lib/geo";
import { hapticSelectionChanged } from "@/lib/haptics";
import { formatVisitDate } from "@/lib/date";
import { hasCoordinates } from "@/lib/office-status";
import { shareContent } from "@/lib/share";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { usePublicNotes } from "@/hooks/usePublicNotes";
import type { PublicVisitNote } from "@/lib/visits/remote-store";
import type { OfficeWithStatus } from "@/types";

interface OfficeDetailProps {
  office: OfficeWithStatus;
  onClose: () => void;
  onMarkVisited: (officeId: number) => void;
  onEditVisit?: (officeId: number) => void;
  /** Asks for the person's location so the banner can say whether they are at the office. */
  onCheckDistance?: () => void;
  /** Stamps collected in this state (including this one) and the state's total, for the stamped message. */
  collected?: number;
  total?: number;
  stateName?: string;
}

function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10] ?? "th"}`;
}

/** Headline size follows the name's length so long names wrap to two lines at most. */
function headlineClass(name: string): string {
  if (name.length <= 10) return "text-[48px] leading-[52px]";
  if (name.length <= 16) return "text-[38px] leading-[42px]";
  return "text-[30px] leading-[34px]";
}

/** A small round glass button with a label underneath: the quiet actions of the card. */
const ROUND_BTN =
  "kp-glass grid size-14 place-items-center rounded-full text-ink";
const ROUND_LABEL =
  "text-[11px] font-semibold uppercase leading-3 tracking-[0.1em] text-muted";

type DetailTab = "about" | "notes" | "public";

/** A section label with the small postal-red accent bar, used throughout the About tab. */
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
      <span aria-hidden className="h-3 w-[3px] shrink-0 rounded-sm bg-postal" />
      {children}
    </p>
  );
}

/** Centered icon + title + description, used for every "nothing here yet" tab state. */
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-4 text-center">
      <span
        aria-hidden
        className="mb-3 grid size-14 place-items-center rounded-full bg-ink/[0.04] text-muted"
      >
        {icon}
      </span>
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mt-1 max-w-[260px] text-[13px] leading-[18px] text-muted">
        {description}
      </p>
    </div>
  );
}

/** Instagram-style green starburst verified badge, shown only for visited offices. */
function VerifiedBadge() {
  return (
    <span
      aria-label="Stamped — verified"
      className="mt-2.5 inline-block size-6 shrink-0"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full"
      >
        <path
          d="M12 1l2.09 3.07L17.5 3l.41 3.5L21.4 8l-1.6 3.12L21.4 14.2l-3.5 1.52L17.5 19.2l-3.41-1.07L12 21.2l-2.09-3.07L6.5 19.2l-.41-3.48L2.6 14.2l1.6-3.08L2.6 8l3.49-1.5L6.5 3l3.41 1.07L12 1z"
          fill="var(--color-visited-ink)"
        />
        <path
          d="M8.5 12.5l2 2 5-5"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Details and actions for one office. A docked panel on phones (it sits on top of the tab bar),
 * a card floating over the map on larger screens.
 */
export function OfficeDetail({
  office,
  onClose,
  onMarkVisited,
  onEditVisit,
  onCheckDistance,
  collected,
  total,
  stateName,
}: OfficeDetailProps) {
  const { visits, togglePlanned } = useVisits();
  const { showToast } = useToast();
  const visit = visits[office.id];
  const publicNotes = usePublicNotes(office.id);
  const isPlanned = office.status === "planned";
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("about");
  const [showContribute, setShowContribute] = useState(false);
  const [contributeClosing, setContributeClosing] = useState(false);
  // The panel plays its fall animation before the parent actually unmounts it,
  // so closing is as fluid as the rise it opened with instead of a hard cut.
  const [closing, setClosing] = useState(false);

  function handleClose() {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 200);
  }

  function closeContribute() {
    if (contributeClosing) return;
    setContributeClosing(true);
    setTimeout(() => {
      setShowContribute(false);
      setContributeClosing(false);
    }, 200);
  }

  async function handleShare() {
    const result = await shareContent({
      title: "Philatrail",
      text: `I just stamped ${office.name}${
        stateName ? ` in ${stateName}` : ""
      } on Philatrail.`,
      url: window.location.origin,
    });
    if (result === "copied")
      showToast({ message: "Copied. Paste it anywhere to share." });
    if (result === "failed")
      showToast({ message: "Could not share. Please try again." });
  }

  return (
    <div
      role="region"
      aria-label={`${office.name} details`}
      className={`kp-glass-panel absolute inset-x-0 bottom-0 z-[1100] flex max-h-[85%] flex-col rounded-t-[24px] md:inset-x-auto md:bottom-auto md:left-14 md:top-4 md:max-h-[calc(100%-2rem)] md:w-96 md:rounded-2xl md:bg-white md:shadow-xl ${
        closing ? "animate-fall" : "animate-rise"
      }`}
    >
      {/* Grab handle (mobile only) */}
      <div
        aria-hidden="true"
        className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#c7c7cc] md:hidden"
      />

      {/* Scrollable content */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3">
        {/* ── Name row + verified badge + close ── */}
        <div className="flex items-start justify-between gap-3 pt-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2
              className={`-ml-0.5 min-w-0 font-medium uppercase tracking-[0.01em] ${headlineClass(
                office.name
              )}`}
            >
              {office.name}
            </h2>
            {visit ? <VerifiedBadge /> : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close post office details"
            className="kp-glass grid size-8 shrink-0 place-items-center rounded-full text-ink"
          >
            <CloseIcon className="size-[11px]" strokeWidth={2.8} />
          </button>
        </div>

        {/* ── Meta: district · pincode · distance ── */}
        <p className="mt-2 flex items-center gap-3 text-sm leading-5 text-muted">
          <span>{office.district}</span>
          <span aria-hidden className="h-3.5 w-px bg-[#b8861b]" />
          <span className="font-mono tracking-[0.08em]">
            {office.pincode || "No pincode"}
          </span>
          {office.distanceKm !== null ? (
            <>
              <span aria-hidden className="h-3.5 w-px bg-[#b8861b]" />
              <span className="font-mono text-[13px] font-bold uppercase">
                {formatDistance(office.distanceKm)}
              </span>
            </>
          ) : null}
        </p>

        <CounterHours />

        {/* ── Status row: left (badge + proximity/progress) | right (PPC image) ──
            Always side by side — the image never pushes the badge to its own line.
            The left column has a floor just wide enough for the status badge, so on
            a narrow phone it's the "Check if you're here" button (the widest thing
            in this column) that wraps to a second line and the pill grows taller to
            fit it (see ProximityButton's min-h), never the row as a whole. */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="flex min-w-[150px] flex-1 flex-col items-start gap-2">
            <StatusBadge
              status={office.status}
              stampedOn={visit ? formatVisitDate(visit.visitedAt) : undefined}
            />
            {visit ? (
              <p className="text-xs leading-4">
                {collected && total ? (
                  <>
                    Your <b className="font-semibold">{ordinal(collected)}</b>{" "}
                    stamp
                    {stateName ? ` in ${stateName}` : ""}.{" "}
                    {Math.max(total - collected, 0)} to go.
                  </>
                ) : (
                  "Stamped in your passport."
                )}
              </p>
            ) : (
              <ProximityButton
                km={office.distanceKm}
                onCheckDistance={onCheckDistance}
              />
            )}
          </div>
          {/* PPC image — always full colour; the green badge is the visited indicator.
              Nudged up slightly so its top visually lines up with the status badge/text
              rather than the (slightly padded) edge of its own frame. */}
          <StampThumb
            path={office.stampImagePath}
            status="visited"
            natural
            className="-mt-1 shrink-0 rounded-2xl border border-ink/10 shadow-[0_2px_8px_rgba(22,32,79,0.06)]"
          />
        </div>

        {/* ── Proximity warning (when located but far away, unvisited only) ── */}
        {!visit ? (
          <ProximityWarning km={office.distanceKm} />
        ) : null}

        {/* ── Tab bar: About · Notes · Public ── */}
        <div className="mt-3.5 flex border-b border-ink/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`relative flex-1 py-2.5 pb-2 text-[13px] font-semibold ${
              activeTab === "about"
                ? "font-bold text-ink after:absolute after:inset-x-4 after:-bottom-px after:h-[2.5px] after:rounded-sm after:bg-ink"
                : "text-muted"
            }`}
          >
            About
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`relative flex-1 py-2.5 pb-2 text-[13px] font-semibold ${
              activeTab === "notes"
                ? "font-bold text-ink after:absolute after:inset-x-4 after:-bottom-px after:h-[2.5px] after:rounded-sm after:bg-ink"
                : "text-muted"
            }`}
          >
            Notes
            {visit?.note ? (
              <span className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink/10 px-[5px] text-[10px] font-bold align-text-top">
                1
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("public")}
            className={`relative flex-1 py-2.5 pb-2 text-[13px] font-semibold ${
              activeTab === "public"
                ? "font-bold text-ink after:absolute after:inset-x-4 after:-bottom-px after:h-[2.5px] after:rounded-sm after:bg-ink"
                : "text-muted"
            }`}
          >
            Public
          </button>
        </div>

        {/* ── Tab content ── */}
        <div className="pt-3.5">
          {activeTab === "about" ? (
            <>
              {office.district ? (
                <div className="mb-2 rounded-xl bg-ink/[0.025] p-3">
                  <SectionLabel>About this place</SectionLabel>
                  <p
                    className={`mt-2 text-sm leading-[21px] ${
                      !aboutExpanded ? "line-clamp-3" : ""
                    }`}
                  >
                    {office.aboutPlace ||
                      `A philatelic post office in ${office.district} district, Karnataka. Visit to collect its unique postmark cancellation stamp in your passport.`}
                  </p>
                  {!aboutExpanded ? (
                    <button
                      type="button"
                      onClick={() => setAboutExpanded(true)}
                      className="mt-1 text-[13px] font-semibold text-[#2f4aa8]"
                    >
                      Read more
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === "notes" ? (
            <>
              {!visit ? (
                <EmptyState
                  icon={<NoteIcon className="size-7" strokeWidth={1.5} />}
                  title="No notes yet"
                  description="Visit this office and stamp your passport to start adding notes and photos."
                />
              ) : visit.note ? (
                <div className="overflow-hidden rounded-2xl border border-ink/[0.06] bg-ink/[0.02]">
                  <p className="whitespace-pre-line px-4 py-3 text-sm leading-[21px]">
                    {visit.note}
                  </p>
                </div>
              ) : (
                <EmptyState
                  icon={<NoteIcon className="size-7" strokeWidth={1.5} />}
                  title="No notes yet"
                  description="Add a note or photo from your visit — only you can see it unless you make it public."
                />
              )}
              {visit && onEditVisit ? (
                <button
                  type="button"
                  onClick={() => onEditVisit(office.id)}
                  className="mt-2 text-[13px] font-semibold text-[#2f4aa8]"
                >
                  {visit.note || visit.photoPath
                    ? "Edit note & photo"
                    : "Add a note"}
                </button>
              ) : null}
            </>
          ) : null}

          {activeTab === "public" ? (
            <>
              {publicNotes === null ? (
                <p className="py-4 text-center text-sm text-muted">
                  Loading public notes…
                </p>
              ) : publicNotes.length === 0 ? (
                <EmptyState
                  icon={<GlobeIcon className="size-7" strokeWidth={1.5} />}
                  title="No public notes yet"
                  description="Tips and photos other collectors choose to share publicly will show up here."
                />
              ) : (
                <div>
                  {publicNotes.map((note) => (
                    <PublicNoteRow key={note.userId} note={note} />
                  ))}
                </div>
              )}
              {visit && onEditVisit ? (
                <button
                  type="button"
                  onClick={() => onEditVisit(office.id)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border-[1.5px] border-ink/10 py-3 text-[13px] font-semibold text-postal"
                >
                  <GlobeIcon className="size-4" strokeWidth={2} />
                  Write a public note
                </button>
              ) : !visit ? (
                <p className="mt-3 text-center text-[13px] text-muted">
                  Stamp your passport here to write a public note.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/* ── Actions (pinned to bottom) ── */}
      <div className="relative shrink-0 px-4 pb-2 pt-3">
        {visit ? (
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-[28px] bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.35),0_8px_18px_-8px_rgb(207_24_48/0.7)]"
            >
              <ShareIcon className="size-5" strokeWidth={2.8} />
              Share stamp
            </button>
            <div className="flex w-14 flex-none flex-col items-center gap-2">
              <Link
                href="/passport"
                aria-label="Stamps"
                className={ROUND_BTN}
              >
                <NoteIcon className="size-[22px]" />
              </Link>
              <span className={ROUND_LABEL}>Stamps</span>
            </div>
            {hasCoordinates(office) ? <RouteButton office={office} /> : null}
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => onMarkVisited(office.id)}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[28px] bg-gradient-to-b from-[#e0334a] to-postal pl-1 text-base font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.35),0_8px_18px_-8px_rgb(207_24_48/0.7)]"
            >
              <CheckIcon className="size-5" strokeWidth={2.8} />
              Stamp it
            </button>
            <div className="flex w-14 flex-none flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => { void hapticSelectionChanged(); togglePlanned(office.id); }}
                aria-pressed={isPlanned}
                aria-label={isPlanned ? "Remove from planned" : "Plan a visit"}
                className={`${ROUND_BTN} ${
                  isPlanned ? "ring-2 ring-[#2f4aa8]" : ""
                }`}
              >
                <FlagIcon className="size-[22px] text-[#2f4aa8]" />
              </button>
              <span className={ROUND_LABEL}>
                {isPlanned ? "Planned" : "Plan"}
              </span>
            </div>
            {hasCoordinates(office) ? <RouteButton office={office} /> : null}
          </div>
        )}

        {/* ── Help improve / contribute ── */}
        <button
          type="button"
          onClick={() => setShowContribute(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 py-3 text-[13px] text-muted"
        >
          <AlertIcon className="size-3.5" />
          Something wrong? Help improve this
        </button>
      </div>

      {/* ── Contribute sheet (overlay) ── */}
      {showContribute ? (
        <>
          {/* Scrim — tapping outside closes the sheet */}
          <div
            aria-hidden="true"
            className={`fixed inset-0 z-[1150] bg-black/20 ${
              contributeClosing ? "animate-fade-out" : "animate-fade-in"
            }`}
            onClick={closeContribute}
          />
          <ContributeSheet
            office={office}
            onClose={closeContribute}
            closing={contributeClosing}
          />
        </>
      ) : null}
    </div>
  );
}

/** One public note: Google-Maps-review style — avatar, name, date, text, optional photo. */
function PublicNoteRow({ note }: { note: PublicVisitNote }) {
  const photoUrl = usePhotoUrl(note.photoPath);
  const name = note.author?.fullName?.trim() || "A collector";
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex gap-3 border-b border-ink/[0.06] py-3.5 last:border-b-0">
      {note.author?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset
        <img
          src={note.author.avatarUrl}
          alt=""
          className="size-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-postal-soft text-sm font-bold text-postal">
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-[13px] font-semibold">{name}</p>
          <p className="shrink-0 text-[12px] text-muted">
            {formatVisitDate(note.visitedAt)}
          </p>
        </div>
        <p className="mt-1 whitespace-pre-line text-sm leading-[21px]">
          {note.note}
        </p>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset
          <img
            src={photoUrl}
            alt=""
            className="mt-2 h-32 w-full rounded-xl object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}

function RouteButton({
  office,
}: {
  office: OfficeWithStatus & { lat: number; lng: number };
}) {
  return (
    <div className="flex w-14 flex-none flex-col items-center gap-2">
      <a
        href={directionsUrl({ lat: office.lat, lng: office.lng })}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Directions"
        className={ROUND_BTN}
      >
        <NavigationIcon className="size-[22px]" />
      </a>
      <span className={ROUND_LABEL}>Route</span>
    </div>
  );
}

/**
 * The "Check if you're here" button — sits inside the status-left column,
 * aligned with the badge above it.
 */
function ProximityButton({
  km,
  onCheckDistance,
}: {
  km: number | null;
  onCheckDistance?: () => void;
}) {
  const state = proximity(km);
  if (state === "here" && km !== null) {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-visited-ink">
        <CheckIcon className="size-4 shrink-0" strokeWidth={3} />
        You&apos;re here · {formatShortDistance(km)} away
      </p>
    );
  }
  if (state === "unknown" || km === null) {
    return onCheckDistance ? (
      <button
        type="button"
        onClick={onCheckDistance}
        className="kp-glass flex min-h-11 w-fit items-center gap-2 rounded-full py-2.5 pl-2.5 pr-4 text-sm font-semibold text-ink"
      >
        <TargetIcon className="size-4 shrink-0 text-postal" />
        Check if you&apos;re here
      </button>
    ) : null;
  }
  return null;
}

const COUNTER_TONE: Record<CounterState, string> = {
  open: "text-visited-ink",
  lunch: "text-warn",
  closed: "text-muted",
};

/**
 * One line, never wrapping, so the stamp image below it keeps its place:
 * "Timings: 9 AM – 5 PM · OPEN". Hours are placeholders (lib/counter-hours.ts).
 * Computed after mount so server and client never disagree about the time.
 */
function CounterHours() {
  const [status, setStatus] = useState<CounterStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(counterStatus(new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  if (!status) return null;
  return (
    <p className="mt-2 truncate text-[13px] leading-5 text-muted" data-testid="counter-hours">
      Timings: {status.hours} ·{" "}
      <b className={`font-bold tracking-[0.04em] ${COUNTER_TONE[status.state]}`}>{status.word}</b>
    </p>
  );
}

/** Warning banner shown below the status row when the person is far from the office. */
function ProximityWarning({
  km,
}: {
  km: number | null;
}) {
  const state = proximity(km);
  if (state !== "away" || km === null) return null;
  return (
    <p className="mt-4 flex items-start gap-2 rounded-2xl bg-warn-soft p-3 text-sm text-warn">
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        <b>You&apos;re {formatDistance(km)} away.</b> Stamps are meant to be
        collected in person. You can still log a past visit.
      </span>
    </p>
  );
}
