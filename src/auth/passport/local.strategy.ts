// import { Strategy } from 'passport-local';
// import { PassportStrategy } from '@nestjs/passport';
// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { AuthService } from '@/auth/auth.service';
// import { IUser } from '@/users/interfaces/IUser';

// @Injectable()
// export class LocalStrategy extends PassportStrategy(Strategy) {
//   constructor(private authService: AuthService) {
//     super();
//   }

//   async validate(username: string, password: string): Promise<IUser> { // not change parameter names because passport-local depends on these names
//     const user = await this.authService.validateUser(username, password);
//     if (!user) {
//       throw new UnauthorizedException("Invalid username or password");
//     }
//     return user;
//   }
// }