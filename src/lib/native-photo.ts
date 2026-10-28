import { isNativeApp } from "@/lib/native";

/**
 * Asks the phone's own camera or photo library for a picture (apps only).
 * Returns null when the person cancels or when this is not the mobile app.
 */
export async function pickNativePhoto(): Promise<File | null> {
  if (!isNativeApp()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import(
      "@capacitor/camera"
    );
    const photo = await Camera.getPhoto({
      quality: 80,
      width: 1600,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      promptLabelHeader: "Photo of your stamp",
      promptLabelPhoto: "Choose from library",
      promptLabelPicture: "Take a photo",
    });
    if (!photo.webPath) return null;
    const blob = await (await fetch(photo.webPath)).blob();
    return new File([blob], `stamp.${photo.format || "jpg"}`, {
      type: blob.type || "image/jpeg",
    });
  } catch {
    return null;
  }
}
