import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
config();
import { CreateStressLevelRecordDto } from './dto/create-stress-level-record.dto';
import { StressLevelRecord } from './entities/stress-level-record.entity';
import {
  IMG_HEIGHT_RESIZED,
  IMG_WIDTH_RESIZED,
} from '../constant/stress-tracking.constants';
@Injectable()
export class StressTrackingService {
  constructor(
    @Inject('FIRESTORE') private readonly firestore: Firestore,
    @Inject('STORAGE') private readonly storage: Storage,
  ) {}

  async create(
    createStressLevelRecordDto: CreateStressLevelRecordDto,
  ): Promise<StressLevelRecord> {
    const { userId, stressLevel, image, timestamp } =
      createStressLevelRecordDto;

    if (stressLevel < 0 || stressLevel > 5) {
      throw new BadRequestException(
        'The stress level must be between 0 and 5.',
      );
    }

    const stressLevelRecord = new StressLevelRecord();
    stressLevelRecord.userId = userId;
    stressLevelRecord.stressLevel = stressLevel;
    stressLevelRecord.image = image;
    stressLevelRecord.timestamp = timestamp ? timestamp : new Date();

    const docRef = await this.firestore.collection('stress-level-records').add({
      userId: stressLevelRecord.userId,
      stressLevel: stressLevelRecord.stressLevel,
      image: stressLevelRecord.image,
      timestamp: stressLevelRecord.timestamp,
    });

    stressLevelRecord.id = docRef.id;

    return stressLevelRecord;
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const validMimeTypes = ['image/jpeg', 'image/png'];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG and PNG images are allowed.',
      );
    }

    const filename = `${uuidv4()}.jpg`;

    const bucket = this.storage.bucket(process.env.FIREBASE_BUCKET);

    const resizedImageBuffer = await sharp(file.buffer)
      .resize(IMG_HEIGHT_RESIZED, IMG_WIDTH_RESIZED)
      .jpeg()
      .toBuffer();

    const fileUpload = bucket.file(filename);

    return new Promise((resolve, reject) => {
      const uploadStream = fileUpload.createWriteStream({
        metadata: {
          contentType: 'image/jpeg',
        },
      });

      uploadStream.on('error', (error) => {
        reject(`Failed to upload image: ${error.message}`);
      });

      uploadStream.on('finish', async () => {
        const publicUrl = `${process.env.FIREBASE_STORAGE_HOST}/${bucket.name}/${fileUpload.name}`;
        resolve(publicUrl);
      });

      uploadStream.end(resizedImageBuffer);
    });
  }

  async getAllRecords(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<StressLevelRecord[]> {
    const querySnapshot = await this.firestore
      .collection('stress-level-records')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .get();

    const stressTrackingRecords: StressLevelRecord[] = [];

    querySnapshot.forEach((doc) => {
      const stressLevelRecord = new StressLevelRecord();
      stressLevelRecord.id = doc.id;
      stressLevelRecord.userId = doc.data().userId;
      stressLevelRecord.stressLevel = doc.data().stressLevel;
      stressLevelRecord.timestamp = doc.data().timestamp.toDate();
      stressLevelRecord.image = doc.data().image;
      stressTrackingRecords.push(stressLevelRecord);
    });

    return stressTrackingRecords;
  }
}
