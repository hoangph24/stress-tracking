import { Test, TestingModule } from '@nestjs/testing';
import { StressTrackingController } from './stress-tracking.controller';
import { StressTrackingService } from './stress-tracking.service';
import { CreateStressLevelRecordDto } from './dto/create-stress-level-record.dto';
import { StressLevelRecord } from './entities/stress-level-record.entity';

describe('StressTrackingController', () => {
  let controller: StressTrackingController;
  let service: StressTrackingService;

  const mockFirestore = () => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn(),
    delete: jest.fn(),
  });

  const mockStorage = () => ({
    bucket: jest.fn().mockReturnThis(),
    file: jest.fn().mockReturnThis(),
    createWriteStream: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StressTrackingController],
      providers: [
        StressTrackingService,
        {
          provide: 'FIRESTORE',
          useValue: mockFirestore(),
        },
        {
          provide: 'STORAGE',
          useValue: mockStorage(),
        },
      ],
    }).compile();

    controller = module.get<StressTrackingController>(StressTrackingController);
    service = module.get<StressTrackingService>(StressTrackingService);
  });

  describe('createStressLevelRecord', () => {
    const createStressLevelRecordDto: CreateStressLevelRecordDto = {
      userId: 'test-user-id',
      stressLevel: 3,
    };

    it('should create a new stress level record', async () => {
      const createStressLevelRecordDto: CreateStressLevelRecordDto = {
        userId: 'test-user-id',
        stressLevel: 3,
      };
      const createdStressLevelRecord: StressLevelRecord = {
        id: '1',
        userId: createStressLevelRecordDto.userId,
        stressLevel: createStressLevelRecordDto.stressLevel,
        image: 'example.com',
        timestamp: new Date(),
      };
      jest.spyOn(service, 'create').mockResolvedValue(createdStressLevelRecord);

      const result = await controller.createStressLevelRecord(
        createStressLevelRecordDto,
      );

      expect(result).toEqual({ success: true, data: createdStressLevelRecord });
      expect(service.create).toHaveBeenCalledWith(createStressLevelRecordDto);
    });
    it('should handle errors and return a failure response', async () => {
      const error = new Error('Test error');
      jest.spyOn(service, 'create').mockRejectedValue(error);

      expect(
        await controller.createStressLevelRecord(createStressLevelRecordDto),
      ).toEqual({
        success: false,
        message: error.message,
      });
    });
  });

  describe('uploadImage', () => {
    it('should upload an image and return its URL', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test data'),
      };
      const mockImageUrl = 'https://example.com/image.jpg';
      jest.spyOn(service, 'uploadImage').mockResolvedValue(mockImageUrl);

      const result = await controller.uploadImage(mockFile);
      expect(result).toEqual({
        success: true,
        data: { imageUrl: mockImageUrl },
      });
    });

    it('should return an error message if uploading the image fails', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test data'),
      };
      const mockErrorMessage = 'Failed to upload image';
      jest
        .spyOn(service, 'uploadImage')
        .mockRejectedValue(new Error(mockErrorMessage));

      const result = await controller.uploadImage(mockFile);
      expect(result).toEqual({ success: false, message: mockErrorMessage });
    });
  });

  describe('getAllStressTrackingRecords', () => {
    it('should return an object with success true and data property', async () => {
      const userId = '123';
      const page = '1';
      const pageSize = '10';
      const expectedData: StressLevelRecord[] = [
        {
          id: '1',
          userId: 'user1',
          stressLevel: 3,
          image: 'test-image-url',
          timestamp: new Date(),
        },
        {
          id: '2',
          userId: 'user1',
          stressLevel: 4,
          image: 'test-image-url-2',
          timestamp: new Date(),
        },
      ];

      jest.spyOn(service, 'getAllRecords').mockResolvedValue(expectedData);

      const result = await controller.getAllStressTrackingRecords(
        userId,
        page,
        pageSize,
      );

      expect(result).toEqual({ success: true, data: expectedData });
    });

    it('should return an object with success false and message property if an error occurs', async () => {
      const userId = '123';
      const page = '1';
      const pageSize = '10';
      const expectedError = new Error('An error occurred');

      jest.spyOn(service, 'getAllRecords').mockRejectedValue(expectedError);

      const result = await controller.getAllStressTrackingRecords(
        userId,
        page,
        pageSize,
      );

      expect(result).toEqual({
        success: false,
        message: expectedError.message,
      });
    });
  });
});
