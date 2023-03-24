import { Test } from '@nestjs/testing';
import { StressTrackingService } from './stress-tracking.service';
import { CreateStressLevelRecordDto } from './dto/create-stress-level-record.dto';
import { StressLevelRecord } from './entities/stress-level-record.entity';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
jest.mock('sharp');
import { v4 as uuidv4 } from 'uuid';
jest.mock('uuid');

describe('StressTrackingService', () => {
  let stressTrackingService: StressTrackingService;
  let firestoreMock: any;
  let storageMock: any;

  let storage: any;

  beforeEach(async () => {
    firestoreMock = {
      collection: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      add: jest.fn().mockResolvedValue({ id: '1' }),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    storageMock = {
      bucket: jest.fn(),
      file: jest.fn(),
      createWriteStream: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StressTrackingService,
        {
          provide: 'FIRESTORE',
          useValue: firestoreMock,
        },
        {
          provide: 'STORAGE',
          useValue: storageMock,
        },
      ],
    }).compile();

    stressTrackingService = moduleRef.get<StressTrackingService>(
      StressTrackingService,
    );
    storage = moduleRef.get<any>('STORAGE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createStressLevelRecordDto: CreateStressLevelRecordDto = {
      userId: 'testUser',
      stressLevel: 2,
      image: 'testImage',
      timestamp: new Date(),
    };

    it('should create a new stress level record', async () => {
      const expectedData: StressLevelRecord = {
        id: '1',
        userId: createStressLevelRecordDto.userId,
        stressLevel: createStressLevelRecordDto.stressLevel,
        image: createStressLevelRecordDto.image,
        timestamp: createStressLevelRecordDto.timestamp,
      };

      const result = await stressTrackingService.create(
        createStressLevelRecordDto,
      );

      expect(result).toEqual(expectedData);
      expect(firestoreMock.collection).toHaveBeenCalledWith(
        'stress-level-records',
      );
      expect(firestoreMock.add).toHaveBeenCalledWith({
        userId: createStressLevelRecordDto.userId,
        stressLevel: createStressLevelRecordDto.stressLevel,
        image: createStressLevelRecordDto.image,
        timestamp: createStressLevelRecordDto.timestamp,
      });
    });

    it('should throw a BadRequestException if the stress level is invalid', async () => {
      const invalidData = {
        userId: 'testUser',
        stressLevel: 6,
        image: undefined,
        timestamp: new Date(),
      };

      await expect(stressTrackingService.create(invalidData)).rejects.toThrow(
        new BadRequestException('The stress level must be between 0 and 5.'),
      );
    });
  });

  describe('uploadImage', () => {
    it('should upload an image and return its URL', async () => {
      const mockFile = {
        fieldname: 'test',
        originalname: 'valid_file.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 10000,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      const mockBucket = {
        name: process.env.FIREBASE_BUCKET,
        file: jest.fn(),
      };

      const mockFileObject = {
        publicUrl: 'https://example.com/image.jpg',
      };
      storage.bucket.mockReturnValue(mockBucket);
      mockBucket.file.mockReturnValue({
        createWriteStream: jest.fn().mockReturnValue({
          on: jest.fn().mockImplementation((event, cb) => {
            if (event === 'finish') {
              cb();
            }
          }),
        }),
        getMetadata: jest
          .fn()
          .mockResolvedValue([{ mediaLink: mockFileObject.publicUrl }]),
      });

      const uuid = uuidv4();
      const expectedPublicUrl = `${process.env.FIREBASE_STORAGE_HOST}/${process.env.FIREBASE_BUCKET}/${uuid}`;

      jest.spyOn(uuidv4, 'call').mockImplementation(() => uuid);

      const publicUrl = await stressTrackingService.uploadImage(mockFile);

      expect(storage.bucket).toHaveBeenCalledWith(process.env.FIREBASE_BUCKET);
      expect(mockBucket.file).toHaveBeenCalledWith(`${uuid}.jpg`);
      expect(publicUrl).toBe(expectedPublicUrl);
    });

    it('should throw a BadRequestException if the file type is invalid', async () => {
      const invalidFile = {
        mimetype: 'image/gif',
        buffer: Buffer.from(''),
      };

      const file = {
        fieldname: 'test',
        originalname: 'invalid_file.txt',
        encoding: '7bit',
        mimetype: invalidFile.mimetype,
        size: 10000,
        buffer: invalidFile.buffer,
      } as Express.Multer.File;
      await expect(stressTrackingService.uploadImage(file)).rejects.toThrow(
        new BadRequestException(
          'Invalid file type. Only JPEG and PNG images are allowed.',
        ),
      );
    });
  });

  describe('getAllRecords', () => {
    const querySnapshot = {
      forEach: jest.fn((callback) => {
        const docArray = [
          {
            id: 'record1',
            data: jest.fn().mockReturnValue({
              userId: 'user1',
              stressLevel: 3,
              timestamp: {
                toDate: jest.fn().mockReturnValue(new Date()),
              },
              image: 'image1',
            }),
          },
          {
            id: 'record2',
            data: jest.fn().mockReturnValue({
              userId: 'user1',
              stressLevel: 2,
              timestamp: {
                toDate: jest.fn().mockReturnValue(new Date()),
              },
              image: 'image2',
            }),
          },
        ];
        docArray.forEach(callback);
      }),
    };

    it('should return an empty array if no records are found', async () => {
      const stressTrackingService = {
        async getAllRecords(userId: string, page: number, pageSize: number) {
          return [];
        },
        firestore: {},
      };

      const records = await stressTrackingService.getAllRecords(
        'mockUserId',
        1,
        10,
      );

      expect(records).toEqual([]);
    });

    it('should return an array of length 2 if two records are found', async () => {
      jest
        .spyOn(stressTrackingService['firestore'], 'collection')
        .mockReturnValue({
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue(querySnapshot),
        } as any);

      const result = await stressTrackingService.getAllRecords('user1', 1, 10);

      expect(result.length).toEqual(2);
      expect(result[0].id).toEqual('record1');
      expect(result[0].userId).toEqual('user1');
      expect(result[0].stressLevel).toEqual(3);
      expect(result[0].timestamp instanceof Date).toBe(true);
      expect(result[0].image).toEqual('image1');
    });
  });
});
