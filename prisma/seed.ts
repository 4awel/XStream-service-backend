/**
 * Справочник категорий и тегов. Идемпотентен: upsert по slug, можно гонять
 * сколько угодно раз — новые строки добавятся, существующие обновятся.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TagGroup, TagKind } from "./generated/client";

type SeedTag = {
  slug: string;
  title: string;
  kind: TagKind;
  group?: TagGroup;
  isMature?: boolean;
};

const C = TagKind.CATEGORY;

const TAGS: SeedTag[] = [
  // Игры
  { slug: "cs2", title: "Counter-Strike 2", kind: C, group: TagGroup.GAME },
  { slug: "dota-2", title: "Dota 2", kind: C, group: TagGroup.GAME },
  { slug: "valorant", title: "Valorant", kind: C, group: TagGroup.GAME },
  { slug: "minecraft", title: "Minecraft", kind: C, group: TagGroup.GAME },
  { slug: "gta-v", title: "GTA V", kind: C, group: TagGroup.GAME },
  { slug: "fortnite", title: "Fortnite", kind: C, group: TagGroup.GAME },
  { slug: "league-of-legends", title: "League of Legends", kind: C, group: TagGroup.GAME },
  { slug: "world-of-tanks", title: "World of Tanks", kind: C, group: TagGroup.GAME },
  { slug: "apex-legends", title: "Apex Legends", kind: C, group: TagGroup.GAME },
  { slug: "pubg", title: "PUBG", kind: C, group: TagGroup.GAME },
  { slug: "rust", title: "Rust", kind: C, group: TagGroup.GAME },
  { slug: "indie", title: "Инди-игры", kind: C, group: TagGroup.GAME },
  { slug: "retro", title: "Ретро-игры", kind: C, group: TagGroup.GAME },
  { slug: "horror", title: "Хорроры", kind: C, group: TagGroup.GAME },
  // Не игры
  { slug: "just-chatting", title: "Общение", kind: C, group: TagGroup.TALK },
  { slug: "podcasts", title: "Подкасты", kind: C, group: TagGroup.TALK },
  { slug: "reactions", title: "Реакции", kind: C, group: TagGroup.TALK },
  { slug: "irl", title: "IRL", kind: C, group: TagGroup.IRL },
  { slug: "travel", title: "Путешествия", kind: C, group: TagGroup.IRL },
  { slug: "cooking", title: "Готовка", kind: C, group: TagGroup.IRL },
  { slug: "music", title: "Музыка", kind: C, group: TagGroup.MUSIC },
  { slug: "dj", title: "DJ-сеты", kind: C, group: TagGroup.MUSIC },
  { slug: "art", title: "Рисование", kind: C, group: TagGroup.CREATIVE },
  { slug: "3d", title: "3D и моделирование", kind: C, group: TagGroup.CREATIVE },
  { slug: "programming", title: "Программирование", kind: C, group: TagGroup.EDUCATION },
  { slug: "languages", title: "Изучение языков", kind: C, group: TagGroup.EDUCATION },
  { slug: "esports", title: "Киберспорт", kind: C, group: TagGroup.ESPORTS },
  { slug: "sports", title: "Спорт", kind: C, group: TagGroup.SPORTS },
  { slug: "asmr", title: "ASMR", kind: C, group: TagGroup.OTHER },
  { slug: "casino", title: "Казино", kind: C, group: TagGroup.OTHER },

  // Формат
  { slug: "webcam", title: "С вебкамерой", kind: TagKind.FORMAT },
  { slug: "no-cam", title: "Без камеры", kind: TagKind.FORMAT },
  { slug: "tutorial", title: "Обучение", kind: TagKind.FORMAT },
  { slug: "interactive", title: "Интерактив со зрителями", kind: TagKind.FORMAT },

  // Режим игры
  { slug: "ranked", title: "Рейтинговые игры", kind: TagKind.GAME_MODE },
  { slug: "casual", title: "Казуал", kind: TagKind.GAME_MODE },
  { slug: "speedrun", title: "Спидраны", kind: TagKind.GAME_MODE },
  { slug: "first-playthrough", title: "Первое прохождение", kind: TagKind.GAME_MODE },

  // Настроение
  { slug: "chill", title: "Спокойно", kind: TagKind.MOOD },
  { slug: "hardcore", title: "Хардкор", kind: TagKind.MOOD },
  { slug: "funny", title: "Весело", kind: TagKind.MOOD },
  { slug: "competitive", title: "Соревновательно", kind: TagKind.MOOD },

  // Язык
  { slug: "russian", title: "Русский", kind: TagKind.LANGUAGE },
  { slug: "english", title: "English", kind: TagKind.LANGUAGE },
];

const main = async (): Promise<void> => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    for (const tag of TAGS) {
      const data = {
        title: tag.title,
        kind: tag.kind,
        group: tag.group ?? null,
        isMature: tag.isMature ?? false,
      };
      await prisma.tag.upsert({
        where: { slug: tag.slug },
        create: { slug: tag.slug, ...data },
        update: data,
      });
    }
    console.log(`Теги: ${TAGS.length} шт. записаны`);
  } finally {
    await prisma.$disconnect();
  }
};

void main();
