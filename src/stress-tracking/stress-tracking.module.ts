import { Module } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { config } from 'dotenv';
config();
import { StressTrackingService } from './stress-tracking.service';
import { StressTrackingController } from './stress-tracking.controller';

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

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
