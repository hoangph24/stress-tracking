import { Module } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { StressTrackingService } from './stress-tracking.service';
import { StressTrackingController } from './stress-tracking.controller';

const serviceAccount = require('../../config/serviceAccountKey.json');

@Module({
  imports: [],
  controllers: [StressTrackingController],
  providers: [
    StressTrackingService,
    {
      provide: 'FIRESTORE',
      useFactory: () => {
        const admin = require('firebase-admin');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        return admin.firestore();
      },
    },
    {
      provide: 'STORAGE',
      useFactory: () => {
        const storage = new Storage({
          projectId: process.env.FIREBASE_PROJECT_ID,
          credentials: serviceAccount,
        });
        return storage;
      },
    },
  ],
})
export class StressTrackingModule {}
