import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { MatchingModule } from './matching/matching.module';
import { ChatModule } from './chat/chat.module';
import { SafetyModule } from './safety/safety.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    CommonModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    QuestionnaireModule,
    MatchingModule,
    ChatModule,
    SafetyModule,
    ReportsModule,
    AdminModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
