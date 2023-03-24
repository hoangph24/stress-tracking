import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { StressTrackingModule } from './stress-tracking/stress-tracking.module';

@Module({
  imports: [StressTrackingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
