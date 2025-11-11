import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class JoinGroupDto {
  @IsInt()
  @IsNotEmpty()
  groupId: number;

  @IsString()
  @IsNotEmpty()
  username: string;
}
