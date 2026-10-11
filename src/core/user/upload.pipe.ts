import { BadRequestException } from "@nestjs/common";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

/** 5 МБ на исходник: после перекодирования аватар весит десятки килобайт. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Файл держим в памяти (буфер нужен sharp целиком) и режем размер ещё на этапе
 * чтения потока — до того, как гигантский запрос успеет съесть память.
 * Тип здесь проверяется грубо по Content-Type; настоящая проверка — по
 * содержимому в ImageProcessor.
 */
export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new BadRequestException("Only images are allowed"), false);
      return;
    }
    callback(null, true);
  },
};

export const requireFile = (
  file: Express.Multer.File | undefined,
): Buffer => {
  if (file === undefined) {
    throw new BadRequestException("File is required (field name: file)");
  }
  return file.buffer;
};
