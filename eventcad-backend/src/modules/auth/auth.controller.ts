import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Patch,
  Put,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

/**
 * Controller de autenticação do EventCAD+
 *
 * Endpoints:
 * - POST /auth/login - Login com email/senha
 * - POST /auth/register - Registro de novo usuário
 * - POST /auth/refresh - Renovação de token
 * - GET /auth/profile - Perfil do usuário logado
 * - POST /auth/logout - Logout (invalidação de token)
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de login
   * Autentica usuário e retorna tokens JWT
   */
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login de usuário',
    description: 'Autentica usuário com email e senha, retornando tokens JWT',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou conta bloqueada',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas de login - tente novamente mais tarde',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<LoginResponseDto> {
    // O AuthGuard('local') já validou as credenciais
    // O usuário está disponível em req.user
    const user = req.user as User;

    return this.authService.login(loginDto, {
      clientIp,
      userAgent,
    });
  }

  /**
   * Endpoint de registro
   * Cria novo usuário no sistema
   */
  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registro de novo usuário',
    description: 'Cria uma nova conta de usuário no sistema',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint de refresh de token
   * Renova token de acesso usando refresh token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovação de token',
    description: 'Renova token de acesso usando refresh token válido',
  })
  @ApiBody({
    schema: {
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Token de refresh válido',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * Endpoint de perfil do usuário
   * Retorna informações do usuário logado
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Perfil do usuário',
    description: 'Retorna informações completas do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário',
    schema: {
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        fullName: { type: 'string' },
        role: { type: 'string' },
        tenantId: { type: 'string' },
        phone: { type: 'string' },
        position: { type: 'string' },
        company: { type: 'string' },
        avatar: { type: 'string' },
        preferredLanguage: { type: 'string' },
        timezone: { type: 'string' },
        lastLoginAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        settings: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async getProfile(@CurrentUser() user: any) {
    // Verifica se o usuário existe
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Remove campos sensíveis antes de retornar
    const {
      password,
      mfaSecret,
      emailVerificationToken,
      passwordResetToken,
      ...profile
    } = user;
    return profile;
  }

  /**
   * Endpoint de logout
   * Invalida token atual (implementação simples - em produção usaria blacklist)
   */
  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout do usuário',
    description: 'Invalida a sessão atual do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
  })
  async logout(@CurrentUser() user: any) {
    // Em uma implementação completa, adicionaria o token JWT a uma blacklist
    // Por enquanto, apenas retorna sucesso (o frontend deve remover o token)
    return {
      message: 'Logout realizado com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Endpoint para verificar token
   * Verifica se o token JWT é válido
   */
  @Get('verify')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar token',
    description: 'Verifica se o token JWT é válido',
  })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async verifyToken(@CurrentUser() user: any) {
    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Endpoint para atualizar perfil do usuário
   */
  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar perfil',
    description: 'Atualiza informações do perfil do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
  })
  async updateProfile(@CurrentUser() user: any, @Body() updateData: any) {
    // return this.authService.updateProfile(user.id, updateData);
    throw new Error('Not implemented: updateProfile');
  }

  /**
   * Endpoint para alterar senha
   */
  @Put('password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Alterar senha',
    description: 'Altera a senha do usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
  })
  async changePassword(@CurrentUser() user: any, @Body() passwordData: any) {
    // return this.authService.changePassword(user.id, passwordData);
    throw new Error('Not implemented: changePassword');
  }

  /**
   * Endpoint para atualizar notificações
   */
  @Put('notifications')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar notificações',
    description: 'Atualiza configurações de notificação do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificações atualizadas com sucesso',
  })
  async updateNotifications(
    @CurrentUser() user: any,
    @Body() notificationData: any,
  ) {
    // return this.authService.updateNotifications(user.id, notificationData);
    throw new Error('Not implemented: updateNotifications');
  }

  /**
   * Endpoint para estatísticas do usuário
   */
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Estatísticas do usuário',
    description: 'Retorna estatísticas do usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getUserStats(@CurrentUser() user: any) {
    // return this.authService.getUserStats(user.id);
    throw new Error('Not implemented: getUserStats');
  }

  /**
   * Endpoint para atividade do usuário
   */
  @Get('activity')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atividade do usuário',
    description: 'Retorna histórico de atividade do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Atividade retornada com sucesso',
  })
  async getUserActivity(@CurrentUser() user: any) {
    // return this.authService.getUserActivity(user.id);
    throw new Error('Not implemented: getUserActivity');
  }
}
