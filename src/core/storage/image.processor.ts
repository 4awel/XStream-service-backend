import { BadRequestException, Injectable } from "@nestjs/common";
import sharp from "sharp";

export type ImagePreset = "avatar" | "banner";

const PRESETS: Record<ImagePreset, { width: number; height: number }> = {
  avatar: { width: 256, height: 256 },
  banner: { width: 1600, height: 400 },
};

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "gif"]);

/** Защита от «декомпрессионной бомбы»: маленький файл с гигантским разрешением. */
const MAX_INPUT_PIXELS = 40_000_000;

export interface ProcessedImage {
  body: Buffer;
  contentType: string;
  extension: string;
}

/**
 * Любая загруженная картинка перекодируется в webp нужного размера.
 *
 * Это и оптимизация (аватар 256px вместо 4К-фото), и безопасность: формат
 * определяется по содержимому, а не по расширению или Content-Type клиента,
 * EXIF с геолокацией выбрасывается, а файл-полиглот (картинка + HTML/JS)
 * после перекодирования перестаёт быть полиглотом.
 */
@Injectable()
export class ImageProcessor {
  async process(input: Buffer, preset: ImagePreset): Promise<ProcessedImage> {
    const { width, height } = PRESETS[preset];

    let format: string | undefined;
    try {
      ({ format } = await sharp(input, {
        limitInputPixels: MAX_INPUT_PIXELS,
      }).metadata());
    } catch {
      throw new BadRequestException("File is not a valid image");
    }

    if (format === undefined || !ALLOWED_FORMATS.has(format)) {
      throw new BadRequestException("Allowed formats: jpeg, png, webp, gif");
    }

    // rotate() без аргументов применяет ориентацию из EXIF до того, как EXIF выкинется.
    const body = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize(width, height, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();

    return { body, contentType: "image/webp", extension: "webp" };
  }
}
