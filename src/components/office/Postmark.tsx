import { useId } from "react";

/** A navy double-ring postmark with the office name, state and date: the stamp left in the passport. */
export function Postmark({
  name,
  date,
  pincode,
  className = "size-[120px]",
}: {
  name: string;
  date: string;
  pincode: string;
  className?: string;
}) {
  const id = useId();
  const parts = date.toUpperCase().split(" ");
  const dayMonth = parts.slice(0, 2).join(" ");
  const year = parts.slice(2).join(" ");
  const top = `${name.replace(/ SO$| BO$/i, "")} SO · KA`.toUpperCase();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      className={`${className} -rotate-[8deg] text-[#16204f]/80`}
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <path id={`${id}-arc`} d="M 20 60 A 40 40 0 0 1 100 60" />
        <path id={`${id}-arc2`} d="M 16 60 A 44 44 0 0 0 104 60" />
      </defs>
      <circle cx="60" cy="60" r="57" strokeWidth="2.4" />
      <circle cx="60" cy="60" r="32" strokeWidth="1.4" />
      <text
        fill="currentColor"
        stroke="none"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1.6"
        textAnchor="middle"
      >
        <textPath href={`#${id}-arc`} startOffset="50%">
          {top}
        </textPath>
      </text>
      <text
        fill="currentColor"
        stroke="none"
        fontSize="9"
        fontWeight="700"
        letterSpacing="2"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
      >
        <textPath href={`#${id}-arc2`} startOffset="50%">
          {pincode}
        </textPath>
      </text>
      <text
        x="60"
        y="58"
        fill="currentColor"
        stroke="none"
        fontSize="9.5"
        fontWeight="700"
        textAnchor="middle"
      >
        {dayMonth}
      </text>
      <text
        x="60"
        y="71"
        fill="currentColor"
        stroke="none"
        fontSize="9"
        fontWeight="700"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
      >
        {year}
      </text>
    </svg>
  );
}
