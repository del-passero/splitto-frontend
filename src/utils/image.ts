// src/utils/image.ts
export type CompressOptions = {
  maxSide?: number
  quality?: number
  mime?: "image/jpeg" | "image/webp" | "image/png"
  targetBytes?: number
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Универсальная компрессия изображений.
 * Особенности:
 *  • Масштабирует до maxSide по большей стороне, не увеличивает маленькие (scale<=1).
 *  • По умолчанию JPEG и БЕЛАЯ подложка — чтобы PNG с прозрачностью не становились чёрными при конвертации в JPEG.
 *  • Если задан targetBytes — понижает качество ступенчато (до 6 шагов, но не ниже 0.4).
 *  • Если оригинал уже меньше targetBytes и масштабирование не требуется — вернём оригинал.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const {
    maxSide = 640,
    quality = 0.85,
    mime = "image/jpeg",
    targetBytes,
  } = opts

  // Если уже уложились в целевой размер и, вероятно, в разрешение — можно не трогать
  if (targetBytes && file.size <= targetBytes) {
    try {
      const img0 = await loadImage(file)
      const needScale = Math.max(img0.width, img0.height) > maxSide
      if (!needScale) return file
      // иначе упадём в обычный цикл компрессии
    } catch {
      return file
    }
  }

  const img = await loadImage(file)
  const { width, height } = img
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))

  // Если масштабировать не нужно и targetBytes не задан — вернём оригинал
  if (scale >= 1 && !targetBytes) return file

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!

  // Белая подложка для JPEG (иначе прозрачность станет чёрной)
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, w, h)
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, w, h)

  let q = quality
  let blob: Blob | null = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, q))
  if (!blob) return file

  if (targetBytes) {
    let tries = 0
    while (blob.size > targetBytes && q > 0.4 && tries < 6) {
      q = Math.max(0.4, q - 0.1)
      // eslint-disable-next-line no-await-in-loop
      const next = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, q))
      if (!next) break
      blob = next
      tries++
    }
  }

  // <-- ВАЖНО: сузим тип перед созданием File
  if (!blob) return file

  // Если после конвертации стало больше — вернём оригинал (кроме случая, когда оригинал тоже здоровый, а целевой размер не задан)
  if (blob.size >= file.size && (!targetBytes || file.size <= targetBytes)) {
    return file
  }

  // Подменяем расширение на .jpg|.webp|.png
  const newName = file.name.replace(/\.(png|jpe?g|webp|bmp|gif|heic|heif|tiff?)$/i, "")
  const ext = mime === "image/webp" ? ".webp" : (mime === "image/png" ? ".png" : ".jpg")
  return new File([blob], `${newName}${ext}`, {
    type: mime,
    lastModified: Date.now(),
  })
}
