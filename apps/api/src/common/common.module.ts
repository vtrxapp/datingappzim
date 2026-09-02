import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

/**
 * Global module so JwtAuthGuard/AdminGuard (both used via `@UseGuards(...)`
 * across every feature module) can be constructor-injected with JwtService
 * and ConfigService without every module re-declaring them as providers.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard, AdminGuard],
  // Re-exporting JwtModule (not just the guards) matters: `@UseGuards(JwtAuthGuard)`
  // instantiates the guard fresh in whichever module the controller lives in, so
  // JwtService itself — not just JwtAuthGuard — must be part of this module's
  // global exports for that resolution to succeed in every feature module.
  exports: [JwtModule, JwtAuthGuard, AdminGuard],
})
export class CommonModule {}
