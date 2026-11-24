import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from './auth.constants';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Sesión iniciada.')
  @ApiOperation({ summary: 'Inicia sesión. La sesión viaja en una cookie httpOnly.' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Detrás del tunnel de Cloudflare la IP real llega en este header
    const ip = (req.headers['cf-connecting-ip'] as string | undefined) ?? req.ip ?? 'unknown';
    const { user, token } = await this.authService.login(dto.email, dto.password, ip);
    res.cookie(SESSION_COOKIE_NAME, token, {
      ...this.cookieOptions(),
      maxAge: SESSION_TTL_SECONDS * 1000,
    });
    return user;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Sesión cerrada.')
  @ApiOperation({ summary: 'Cierra la sesión (borra la cookie).' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE_NAME, this.cookieOptions());
    return null;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ResponseMessage('Usuario actual.')
  @ApiOperation({ summary: 'Devuelve el usuario de la sesión actual.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserById(user.id);
  }

  /**
   * - COOKIE_DOMAIN: p. ej. ".dejuarez.mx" para compartir la cookie entre el
   *   front (eventosmendoza.dejuarez.mx) y el API (api.dejuarez.mx).
   * - COOKIE_SECURE=false solo en desarrollo local sin HTTPS.
   */
  private cookieOptions(): CookieOptions {
    const domain = this.configService.get<string>('COOKIE_DOMAIN');
    return {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') !== 'false',
      sameSite: 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }
}
