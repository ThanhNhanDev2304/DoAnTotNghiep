import { Controller } from '@nestjs/common';
import { SessionService } from '@/session/session.service';
import { ISessionController } from '@/session/interfaces/session.interface';

@Controller('session')
export class SessionController implements ISessionController {
  constructor(private readonly sessionService: SessionService) {}

}
