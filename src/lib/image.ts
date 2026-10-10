const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Downscales a photo and re-encodes it as JPEG so uploads stay small
 * (phone photos are often 5 MB or more, which would exhaust storage quickly).
 */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not process this image.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not compress the image.")),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
