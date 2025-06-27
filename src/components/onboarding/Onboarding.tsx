// src/components/onboarding/Onboarding.tsx
import React, { useEffect, useState } from "react";

export interface OnboardingProps {
  onFinish: () => void;
  onSkip: () => void;
}

function getThemeParam(name: string, fallback: string) {
  // @ts-ignore
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.themeParams) {
    return (window.Telegram.WebApp.themeParams as any)[name] || fallback;
  }
  return fallback;
}

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
  }, []);

  return (
    <div style={{
      background: colors.bg,
      color: colors.text,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "system-ui, sans-serif",
      transition: "background 0.2s",
    }}>
      <img
        src="https://cdn4.iconfinder.com/data/icons/social-media-rounded-corners/512/Telegram-512.png"
        alt="Splitto"
        style={{ width: 80, marginBottom: 24, borderRadius: 20, boxShadow: "0 6px 16px #0002" }}
      />
      <h1 style={{ fontWeight: 800, fontSize: 28, margin: 0, marginBottom: 12 }}>Добро пожаловать!</h1>
      <div style={{ maxWidth: 340, textAlign: "center", fontSize: 18, marginBottom: 36, color: colors.hint }}>
        Splitto — быстрый способ делить траты с друзьями.<br />
        <span style={{ fontSize: 15, color: colors.text, opacity: 0.7 }}>
          Авторизация и интерфейс полностью интегрированы с Telegram.
        </span>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 12 }}>
        <button
          style={{
            padding: "12px 36px",
            fontSize: 17,
            fontWeight: 600,
            borderRadius: 16,
            border: "none",
            background: colors.button,
            color: colors.buttonText,
            boxShadow: "0 2px 16px #0002",
            cursor: "pointer",
            outline: "none",
            transition: "background 0.15s, color 0.15s",
          }}
          onClick={onFinish}
        >
          Начать
        </button>
        <button
          style={{
            padding: "12px 30px",
            fontSize: 17,
            borderRadius: 16,
            border: `1.5px solid ${colors.button}`,
            background: "transparent",
            color: colors.button,
            fontWeight: 600,
            cursor: "pointer",
            outline: "none",
            transition: "background 0.15s, color 0.15s, border 0.2s",
          }}
          onClick={onSkip}
        >
          Позже
        </button>
      </div>
      <div style={{ fontSize: 14, color: colors.hint, marginTop: 18 }}>
        Продолжая, вы принимаете <a href="#" style={{ color: colors.button, textDecoration: "underline" }}>условия использования</a>
      </div>
    </div>
  );
};

export default Onboarding;
