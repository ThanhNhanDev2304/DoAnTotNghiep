import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { UserEntity } from '@/users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
        usernameField: 'userNameOrEmail', // Change to 'email' if you want to use email for authentication
        passwordField: 'password'
    });
  }

  async validate(userNameOrEmail: string, password: string): Promise<UserEntity> { // not change parameter names because passport-local depends on these names
    const user = await this.authService.validateUser(userNameOrEmail, password);
    if (!user) {
      throw new UnauthorizedException("Invalid username or password");
    }
    return user;
  }
}