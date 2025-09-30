// src/pdfjs-setup.ts
// Инициализация pdf.js под Vite: подключаем worker как реальный Web Worker.
import { GlobalWorkerOptions } from "pdfjs-dist";

// Вариант А (рекомендуемый): отдаём pdf.js готовый Worker
import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";
GlobalWorkerOptions.workerPort = new PdfWorker();

// Вариант Б (если хочешь через URL, НЕ используйте оба сразу):
// import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
// GlobalWorkerOptions.workerSrc = workerUrl;
