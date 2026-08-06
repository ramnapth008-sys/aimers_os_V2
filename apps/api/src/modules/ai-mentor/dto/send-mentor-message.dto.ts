import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from "class-validator";

export class SendMentorMessageDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsString()
  @Length(1, 4000)
  content!: string;
}
