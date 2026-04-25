import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator"

export class RegisterDto {

    @ApiProperty({ example: 'example', description: 'The username of the new user' })
    @IsNotEmpty({ message: 'Username must not be empty' })
    @IsString({ message: 'Username must be a string' })
    @MaxLength(100, { message: 'Username must be at most 100 characters long' })
    @MinLength(3, { message: 'Username must be at least 3 characters long' })
    userName!: string

    @ApiProperty({ example: 'example@gmail.com', description: 'The email of the new user' })
    @IsNotEmpty({ message: 'Email must not be empty' })
    @IsString({ message: 'Email must be a string' })
    @MaxLength(100, { message: 'Email must be at most 100 characters long' })
    @MinLength(5, { message: 'Email must be at least 5 characters long' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    email!: string

    @ApiProperty({ example: '654321', description: 'The password of the new user' })
    @IsNotEmpty({ message: 'Password must not be empty' })
    @IsString({ message: 'Password must be a string' })
    @MaxLength(50, { message: 'Password must be at most 50 characters long' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password!: string

}

export class LoginDto {
    @ApiProperty({ example: 'example', description: 'The username or email of the user' })
    @IsNotEmpty({ message: 'Username or email must not be empty' })
    @IsString({ message: 'Username or email must be a string' })
    @MaxLength(100, { message: 'Username or email must be at most 100 characters long' })
    @MinLength(3, { message: 'Username or email must be at least 3 characters long' })
    userNameOrEmail!: string

    @ApiProperty({ example: '654321', description: 'The password of the user' })
    @IsNotEmpty({ message: 'Password must not be empty' })
    @IsString({ message: 'Password must be a string' })
    @MaxLength(50, { message: 'Password must be at most 50 characters long' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password!: string

    @ApiProperty({ example: 'device123', description: 'The ID of the device associated with the session' })
    @IsNotEmpty({ message: 'Device ID must not be empty' })
    @IsString({ message: 'Device ID must be a string' })
    @MaxLength(100, { message: 'Device ID must be at most 100 characters long' })
    deviceId!: string
}

