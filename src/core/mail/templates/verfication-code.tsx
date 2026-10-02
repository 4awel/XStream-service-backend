import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const BASE_URL = process.env.APP_URL ?? "https://xstream.example.com";

const LOGO_URL =
  process.env.LOGO_XS_APP_URL ??
  "https://lh3.googleusercontent.com/d/1iH20bq_9lI2ycPtALC10SCg_Nlht0umP";

const colors = {
  red: "#D64545",
  redDark: "#A83232",
  bg: "#0E0E10",
  card: "#18181B",
  cardBorder: "#27272A",
  codeBg: "#1F1F23",
  text: "#EFEFF1",
  muted: "#A1A1AA",
  faint: "#71717A",
};

interface VerificationCodeEmailProps {
  code: string;
  expiresInMinutes?: number;
  logoUrl?: string;
}

export function VerificationCodeEmail({
  code,
  expiresInMinutes = 10,
  logoUrl = LOGO_URL,
}: VerificationCodeEmailProps) {
  return (
    <Html lang="ru">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>Ваш код подтверждения XStream: {code}</Preview>

      <Body
        style={{
          margin: 0,
          padding: "40px 12px",
          background: colors.bg,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: 480,
            margin: "0 auto",
            background: colors.card,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <Section
            style={{
              background: "#000000",
              backgroundImage: `linear-gradient(135deg, #000000 0%, #1a0707 60%, #3a0d0d 100%)`,
              padding: "32px 24px 28px",
              textAlign: "center",
              borderBottom: `3px solid ${colors.red}`,
            }}
          >
            <Img
              src={logoUrl}
              width="72"
              height="72"
              alt="XStream"
              style={{ margin: "0 auto", borderRadius: 14, display: "block" }}
            />
            <Text
              style={{
                margin: "14px 0 0",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 1,
                color: "#FFFFFF",
                lineHeight: "32px",
              }}
            >
              <span style={{ color: colors.red }}>X</span>Stream
            </Text>
            <Text
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: colors.muted,
              }}
            >
              Смотри. Стримь. Общайся.
            </Text>
          </Section>
          <Section style={{ padding: "32px 32px 8px" }}>
            <Heading
              as="h1"
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: colors.text,
              }}
            >
              Подтверждение почты
            </Heading>
            <Text
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                lineHeight: "24px",
                color: colors.muted,
              }}
            >
              Привет! Чтобы завершить регистрацию на XStream, введи этот код на
              сайте:
            </Text>

            {/* Код */}
            <Section
              style={{
                margin: "24px 0",
                background: colors.codeBg,
                border: `1px solid ${colors.red}`,
                borderRadius: 12,
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: 10,
                  paddingLeft: 10,
                  color: "#FFFFFF",
                  fontFamily: "'Courier New', Courier, monospace",
                }}
              >
                {code}
              </Text>
            </Section>

            <Text
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: "20px",
                color: colors.faint,
                textAlign: "center",
              }}
            >
              Код действует{" "}
              <span style={{ color: colors.red, fontWeight: 700 }}>
                {expiresInMinutes} минут
              </span>
              . Никому его не сообщай.
            </Text>
          </Section>

          <Section style={{ padding: "0 32px 28px" }}>
            <Hr style={{ borderColor: colors.cardBorder, margin: "24px 0" }} />
            <Text
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: "18px",
                color: colors.faint,
              }}
            >
              Если ты не регистрировался на XStream — просто проигнорируй это
              письмо.
            </Text>
          </Section>
        </Container>
        <Text
          style={{
            margin: "20px 0 0",
            fontSize: 12,
            color: colors.faint,
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()}{" "}
          <Link
            href={BASE_URL}
            style={{ color: colors.red, textDecoration: "none" }}
          >
            XStream
          </Link>{" "}
          · Стриминговая платформа
        </Text>
      </Body>
    </Html>
  );
}

VerificationCodeEmail.PreviewProps = {
  code: "482913",
} satisfies VerificationCodeEmailProps;

export default VerificationCodeEmail;
