import React, { useEffect, useState } from "react";
import "../../app/index.css";

export interface OnboardingProps {
  onFinish: () => void;
  onSkip: () => void;
}

const getThemeParam = (name: string, fallback: string): string => {
  // @ts-ignore
  return window.Telegram?.WebApp?.themeParams?.[name] || fallback;
};

const Onboarding: React.FC<OnboardingProps> = ({ onFinish, onSkip }) => {
  const [colors, setColors] = useState({
    bg: "#ffffff",
    text: "#222f3f",
    button: "#3390ec",
    buttonText: "#ffffff",
    hint: "#a8a8a8",
  });

  useEffect(() => {
    setColors({
      bg: getThemeParam("bg_color", "#ffffff"),
      text: getThemeParam("text_color", "#222f3f"),
      button: getThemeParam("button_color", "#3390ec"),
      buttonText: getThemeParam("button_text_color", "#ffffff"),
      hint: getThemeParam("hint_color", "#a8a8a8"),
    });
    // DEBUG: посмотри что реально приходит!
    // @ts-ignore
    console.log("themeParams", window.Telegram?.WebApp?.themeParams);
  }, []);

  return (
    <div style={{
      background: colors.bg,
      color: colors.text,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {/* ...далее твой код */}
      <button
        style={{
          background: colors.button,
          color: colors.buttonText,
        }}
        onClick={onFinish}
      >
        Начать
      </button>
      <button
        style={{
          border: `1.5px solid ${colors.button}`,
          color: colors.button,
        }}
        onClick={onSkip}
      >
        Позже
      </button>
    </div>
  );
};

export default Onboarding;
