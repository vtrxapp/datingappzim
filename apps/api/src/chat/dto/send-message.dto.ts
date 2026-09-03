import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  /** Swipe-to-reply: the message this one responds to. Must belong to the same match. */
  @IsOptional()
  @IsString()
  replyToId?: string;
}
