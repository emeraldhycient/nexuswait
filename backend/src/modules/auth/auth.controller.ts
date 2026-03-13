import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayloadDecorator } from './jwt-payload.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.firstName, dto.lastName);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@JwtPayloadDecorator() payload: { userId: string }) {
    return this.auth.me(payload.userId);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @JwtPayloadDecorator() payload: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.auth.updateProfile(payload.userId, dto);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @JwtPayloadDecorator() payload: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(payload.userId, dto.currentPassword, dto.newPassword);
  }
  @Post('admin/create')
  async createAdminUser(@Body() body: { email: string, password: string, firstName?: string, lastName?: string }) {
    return this.auth.createAdminUser(body.email, body.password, body.firstName, body.lastName);
  }
}
