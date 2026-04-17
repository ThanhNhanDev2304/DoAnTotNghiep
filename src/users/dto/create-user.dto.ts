import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
    @ApiProperty({ description: 'The email of the user', example: 'user@example.com' })
    @IsEmail({}, { message: 'Invalid email address' })
    email!: string;
    @ApiProperty({ description: 'The password of the user', example: 'P@ssw0rd' })
    @IsNotEmpty({ message: 'Password is required' })
    @MaxLength(100, { message: 'Password must be at most 100 characters' })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    @IsString({ message: 'Password must be a string' })
    password!: string;
    @ApiProperty({ description: 'The name of the user', example: 'John Doe' })
    name?: string;

    

}
