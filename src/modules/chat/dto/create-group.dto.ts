import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
