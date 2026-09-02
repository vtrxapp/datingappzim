import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [ProfilesModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
