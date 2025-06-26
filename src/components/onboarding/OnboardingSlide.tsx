import React from "react";
import type { ReactNode } from "react";

export interface OnboardingSlideProps {
  illustration: ReactNode;
  title: string;
  text: string;
  smallText?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  illustration,
  title,
  text,
  smallText,
  buttonText,
  onButtonClick,
}) => (
  <div
    className="
      flex flex-col items-center justify-center
      w-full h-full min-h-[350px] px-6 py-4
      text-center
      max-w-onboarding mx-auto
    "
  >
    <div className="flex justify-center mb-6 mt-2">
      <div
        style={{
          width: "100%",
          maxWidth: 220,
          maxHeight: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {illustration}
      </div>
    </div>

    <h2
      className="font-bold text-[22px] leading-tight mb-3"
      style={{
        color: "var(--tg-theme-text-color)",
        wordBreak: "break-word",
      }}
    >
      {title}
    </h2>

    <div
      className="font-medium text-[17px] leading-snug mb-2"
      style={{
        color: "var(--tg-theme-text-color)",
        wordBreak: "break-word",
        whiteSpace: "pre-line",
      }}
    >
      {text}
    </div>

    {smallText && (
      <div
        className="font-normal text-[15px] leading-normal mb-4"
        style={{ color: "var(--tg-theme-hint-color)" }}
      >
        {smallText}
      </div>
    )}

    {buttonText && onButtonClick && (
      <button
        className="mt-3 px-8 py-3 rounded-xl text-[17px] font-bold transition shadow-sm focus:outline-none w-full max-w-[320px]"
        style={{
          background: "var(--tg-theme-button-color)",
          color: "var(--tg-theme-button-text-color)",
          border: "none",
        }}
        type="button"
        onClick={onButtonClick}
      >
        {buttonText}
      </button>
    )}
  </div>
);

export default OnboardingSlide;
