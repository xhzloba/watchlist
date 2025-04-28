export async function extractColors(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        resolve("#000000")
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let r = 0,
        g = 0,
        b = 0,
        count = 0

      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i]
        g += imageData[i + 1]
        b += imageData[i + 2]
        count++
      }

      r = Math.floor(r / count)
      g = Math.floor(g / count)
      b = Math.floor(b / count)

      resolve(`rgb(${r}, ${g}, ${b})`)
    }

    img.onerror = () => {
      resolve("#000000")
    }

    img.src = imageUrl
  })
}

