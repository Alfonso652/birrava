// Reduce la foto antes de subirla: el bucket limita a 2 MB y el plan gratis a 1 GB total.
export async function comprimir(file: File, max = 1280, calidad = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la foto'))), 'image/jpeg', calidad),
  )
}
