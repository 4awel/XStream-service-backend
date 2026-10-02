import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength } from "class-validator";

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({
    description: "email пользователя",
  })
  // Без нормализации вход с «User@Mail.ru» не нашёл бы аккаунт:
  // при регистрации email приводится к нижнему регистру.
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    description: "пароль пользователя",
  })
  @IsString()
  // Верхняя граница та же, что при регистрации: защищает от DoS
  // через огромный пароль, который уйдёт в scrypt.
  @MaxLength(128)
  password: string;
}
