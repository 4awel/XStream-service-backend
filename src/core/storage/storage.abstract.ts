/**
 * Хранилище файлов. Use case-ы знают только этот контракт, конкретный S3/MinIO
 * подставляется в StorageModule — так же, как IDataServices для базы.
 */
export abstract class IStorage {
  abstract put(key: string, body: Buffer, contentType: string): Promise<void>;

  /** Не бросает, если объекта уже нет: удаление идемпотентно. */
  abstract delete(key: string): Promise<void>;

  /** null → null, чтобы транспорт мог отдавать «нет картинки» без проверок. */
  abstract publicUrl(key: string | null): string | null;
}
