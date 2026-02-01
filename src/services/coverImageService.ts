export class CoverImageService {
  private static instance: CoverImageService

  static getInstance(): CoverImageService {
    if (!CoverImageService.instance) {
      CoverImageService.instance = new CoverImageService()
    }
    return CoverImageService.instance
  }

  async processImage(file: File, cropRect?: { x: number; y: number; width: number; height: number }, scale = 1): Promise<{
    fullImage: Blob
    thumbnail: Blob
    blurred: Blob | undefined
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const img = new Image()
        img.onload = async () => {
          try {
            const fullImage = await this.cropImage(img, cropRect, scale)
            const thumbnail = await this.generateThumbnail(fullImage)
            const blurred = await this.generateBlurredThumbnail(thumbnail)

            resolve({ fullImage, thumbnail, blurred })
          } catch (error) {
            reject(error)
          }
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  private async cropImage(img: HTMLImageElement, cropRect?: { x: number; y: number; width: number; height: number }, scale = 1): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      if (cropRect) {
        // Crop the image
        const cropX = cropRect.x * img.width
        const cropY = cropRect.y * img.height
        const cropWidth = cropRect.width * img.width
        const cropHeight = cropRect.height * img.height

        canvas.width = cropWidth / scale
        canvas.height = cropHeight / scale

        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, canvas.width, canvas.height
        )
      } else {
        // Use full image
        canvas.width = img.width / scale
        canvas.height = img.height / scale
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create image'))
          }
        },
        'image/jpeg',
        0.9
      )
    })
  }

  async generateThumbnail(imageBlob: Blob, targetWidth = 200, targetHeight = 300): Promise<Blob> {
    const objectUrl = URL.createObjectURL(imageBlob)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Calculate scaling to fit within target while maintaining aspect ratio
        const scale = Math.min(targetWidth / img.width, targetHeight / img.height)
        const width = img.width * scale
        const height = img.height * scale
        const x = (targetWidth - width) / 2
        const y = (targetHeight - height) / 2

        canvas.width = targetWidth
        canvas.height = targetHeight

        // Fill with background color
        ctx.fillStyle = '#f1f5f9'
        ctx.fillRect(0, 0, targetWidth, targetHeight)

        ctx.drawImage(img, x, y, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create thumbnail'))
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image'))
      }
      img.src = objectUrl
    })
  }

  async generateBlurredThumbnail(thumbnailBlob: Blob, blurRadius = 10): Promise<Blob | undefined> {
    const objectUrl = URL.createObjectURL(thumbnailBlob)
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(undefined)
          return
        }

        // Use the same size as the thumbnail
        canvas.width = img.width
        canvas.height = img.height

        // Draw the image
        ctx.drawImage(img, 0, 0)

        // Apply blur using CSS filter
        ctx.filter = `blur(${blurRadius}px)`

        // Draw again with blur
        ctx.drawImage(canvas, 0, 0)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              resolve(undefined)
            }
          },
          'image/jpeg',
          0.5
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(undefined)
      }
      img.src = objectUrl
    })
  }

  blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async dataURLToBlob(dataURL: string): Promise<Blob> {
    const response = await fetch(dataURL)
    return response.blob()
  }

  async compressImage(blob: Blob, maxWidth = 800, quality = 0.8): Promise<Blob> {
    const objectUrl = URL.createObjectURL(blob)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = async () => {
        URL.revokeObjectURL(objectUrl)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image'))
      }
      img.src = objectUrl
    })
  }
}

export const coverImageService = CoverImageService.getInstance()
