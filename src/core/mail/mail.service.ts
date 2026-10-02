import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { render } from "@react-email/render";
import { createTransport, Transporter } from "nodemailer";

import { VerificationCodeEmail } from "@/core/mail/templates/verfication-code";

/**
 * Сетевые сбои SMTP (DNS, TLS, таймауты) почти всегда разовые — их стоит
 * повторить. Отказ аутентификации или самого сервера повторять бессмысленно,
 * поэтому список закрытый: всё остальное летит наверх сразу.
 */
const TRANSIENT_ERROR_CODES = new Set([
  "EDNS",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ESOCKET",
  "ECONNECTION",
  "ETIMEDOUT",
  "ECONNRESET",
]);
const SEND_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

@Injectable()
export class MailService {
  private readonly logger = new Logger("MailService");
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = createTransport({
      host: config.getOrThrow("SMTP_HOST"),
      port: config.getOrThrow<number>("SMTP_PORT"),
      secure: config.get("SMTP_SECURE") === "true",
      auth: config.get("SMTP_USER")
        ? { user: config.get("SMTP_USER"), pass: config.get("SMTP_PASSWORD") }
        : undefined,
      // соединение переиспользуется: DNS и TLS-рукопожатие не повторяются на каждое письмо
      pool: true,
      maxConnections: 2,
      // без таймаутов зависший SMTP держит HTTP-запрос до таймаута клиента
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async send(to: string, subject: string, html: string) {
    const from = this.config.getOrThrow<string>("MAIL_FROM");

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.transporter.sendMail({ from, to, subject, html });
      } catch (error) {
        const code = (error as { code?: string }).code;
        const retryable = code !== undefined && TRANSIENT_ERROR_CODES.has(code);

        if (attempt >= SEND_ATTEMPTS || !retryable) {
          throw error;
        }

        this.logger.warn(`SMTP ${code}, попытка ${attempt} из ${SEND_ATTEMPTS}`);
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_BASE_DELAY_MS * attempt),
        );
      }
    }
  }

  async sendVerificationCode(to: string, code: string) {
    const html = await render(VerificationCodeEmail({ code }));
    return this.send(to, "Код подтверждения", html);
  }
}
