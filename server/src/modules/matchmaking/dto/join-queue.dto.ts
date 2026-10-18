import { IsUUID } from 'class-validator';

export class JoinQueueDto {
  @IsUUID()
  tournamentId!: string;
}