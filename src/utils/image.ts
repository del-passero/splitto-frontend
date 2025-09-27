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

export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const { maxSide = 640, quality = 0.85, mime = "image/jpeg", targetBytes } = opts
  const img = await loadImage(file)
  const { width, height } = img
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, w, h)

  let q = quality
  let blob: Blob | null = await new Promise((res) => canvas.toBlob(res, mime, q))
  if (targetBytes && blob) {
    let tries = 0
    while (blob.size > targetBytes && q > 0.4 && tries < 6) {
      q -= 0.1
      // eslint-disable-next-line no-await-in-loop
      blob = await new Promise((res) => canvas.toBlob(res, mime, q))
      tries++
      if (!blob) break
    }
  }
  if (!blob) return file
  return new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp)$/i, ".jpg"), {
    type: mime,
    lastModified: Date.now(),
  })
}
