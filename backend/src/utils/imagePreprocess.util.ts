import sharp from "sharp";

export async function preprocessImage(buffer: Buffer): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const image = sharp(buffer).rotate(); // Auto-rotate based on orientation metadata
  const metadata = await image.metadata();

  let processed = image;
  let width = metadata.width || 0;
  let height = metadata.height || 0;

  // Downscale image if too large to prevent CPU blocking during decoding
  if (width > 1000 || height > 1000) {
    processed = processed.resize(1000, 1000, {
      fit: "inside",
      withoutEnlargement: true
    });
  }

  const { data, info } = await processed
    .flatten({ background: "#ffffff" })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}
