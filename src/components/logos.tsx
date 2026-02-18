import React from "react";

export const Gemini = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M16 4C16 4 16.5 7 19 9.5C21.5 12 24.5 12.5 24.5 12.5C24.5 12.5 21 13 18.5 15.5C16 18 16 21.5 16 21.5C16 21.5 15 18 12.5 15.5C10 13 7 12.5 7 12.5C7 12.5 10 12 12.5 9.5C15 7 16 4 16 4Z"
      fill="#4E8CF7"
    />
    <path
      d="M4 8C4 8 4.5 10 6 11.5C7.5 13 9.5 13.5 9.5 13.5C9.5 13.5 7.5 14 6 15.5C4.5 17 4 19 4 19C4 19 3.5 17 2 15.5C0.5 14 0 13.5 0 13.5C0 13.5 2 13 3.5 11.5C5 10 4 8 4 8Z"
      fill="#E8F0FE"
    />
  </svg>
);

export const Replit = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12Z"
      fill="#F26202"
    />
    <path d="M7 8H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 16H12" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const MagicUI = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="4"
      fill="url(#magic-gradient)"
    />
    <defs>
      <linearGradient
        id="magic-gradient"
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FF0080" />
        <stop offset="1" stopColor="#7928CA" />
      </linearGradient>
    </defs>
    <path
      d="M12 7L13.5 11L17.5 12.5L13.5 14L12 18L10.5 14L6.5 12.5L10.5 11L12 7Z"
      fill="white"
    />
  </svg>
);

export const VSCodium = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M22 2L11 12L22 22V2Z" fill="#2F80ED" />
    <path d="M2 2L13 12L2 22V2Z" fill="#2F80ED" fillOpacity="0.7" />
  </svg>
);

export const MediaWiki = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 4H20V20H4V4Z" fill="#000" />
    <path d="M6 6H18V18H6V6Z" fill="#FFF" />
    <path d="M8 8H16L14 16H10L8 8Z" fill="#000" />
  </svg>
);

export const GooglePaLM = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="10" fill="#FBBC04" />
    <path d="M12 6L14 10H10L12 6Z" fill="white" />
    <path d="M12 18L10 14H14L12 18Z" fill="white" />
  </svg>
);
