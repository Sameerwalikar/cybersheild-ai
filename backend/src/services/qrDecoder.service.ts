import jsQR from "jsqr";
import { MultiFormatReader, LuminanceSource, BinaryBitmap, HybridBinarizer } from "@zxing/library";

export interface DecodeResult {
  success: boolean;
  decodedContent?: string;
  error?: "NO_QR_FOUND" | "MULTIPLE_QR_FOUND" | "UNREADABLE" | "UNSUPPORTED_FORMAT";
}

class RGBAClampedLuminanceSource extends LuminanceSource {
  private buffer: Uint8ClampedArray;

  constructor(buffer: Uint8ClampedArray, width: number, height: number) {
    super(width, height);
    this.buffer = buffer;
  }

  public getRow(y: number, row?: Uint8ClampedArray): Uint8ClampedArray {
    const width = this.getWidth();
    if (!row || row.length < width) {
      row = new Uint8ClampedArray(width);
    }
    const offset = y * width * 4;
    for (let x = 0; x < width; x++) {
      const r = this.buffer[offset + x * 4];
      const g = this.buffer[offset + x * 4 + 1];
      const b = this.buffer[offset + x * 4 + 2];
      row[x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    return row;
  }

  public getMatrix(): Uint8ClampedArray {
    const width = this.getWidth();
    const height = this.getHeight();
    const matrix = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
      const offset = y * width * 4;
      for (let x = 0; x < width; x++) {
        const r = this.buffer[offset + x * 4];
        const g = this.buffer[offset + x * 4 + 1];
        const b = this.buffer[offset + x * 4 + 2];
        matrix[y * width + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      }
    }
    return matrix;
  }

  public invert(): LuminanceSource {
    const len = this.buffer.length;
    const inverted = new Uint8ClampedArray(len);
    for (let i = 0; i < len; i += 4) {
      inverted[i] = 255 - this.buffer[i];
      inverted[i + 1] = 255 - this.buffer[i + 1];
      inverted[i + 2] = 255 - this.buffer[i + 2];
      inverted[i + 3] = this.buffer[i + 3];
    }
    return new RGBAClampedLuminanceSource(inverted, this.getWidth(), this.getHeight());
  }

  public isCropSupported(): boolean {
    return false;
  }

  public crop(left: number, top: number, width: number, height: number): LuminanceSource {
    throw new Error("Crop is not supported.");
  }

  public isRotateSupported(): boolean {
    return false;
  }

  public rotateCounterClockwise(): LuminanceSource {
    throw new Error("Rotate is not supported.");
  }

  public rotateCounterClockwise45(): LuminanceSource {
    throw new Error("Rotate45 is not supported.");
  }
}

export async function decodeQrImage(pixelData: Uint8ClampedArray, width: number, height: number): Promise<DecodeResult> {
  // 1. Try jsQR
  try {
    const code = jsQR(pixelData, width, height);
    if (code && code.data.trim()) {
      return { success: true, decodedContent: code.data };
    }
  } catch (e) {
    // Ignore and proceed to zxing
  }

  // 2. Try ZXing fallback
  try {
    const reader = new MultiFormatReader();
    const source = new RGBAClampedLuminanceSource(pixelData, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const result = reader.decode(bitmap);
    
    if (result && result.getText().trim()) {
      return { success: true, decodedContent: result.getText() };
    }
  } catch (e) {
    // Both decoders failed
  }

  return { success: false, error: "NO_QR_FOUND" };
}
