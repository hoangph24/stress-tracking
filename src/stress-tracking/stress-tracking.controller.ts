import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  Param,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StressTrackingService } from './stress-tracking.service';
import { CreateStressLevelRecordDto } from './dto/create-stress-level-record.dto';

@Controller('stress-tracking')
export class StressTrackingController {
  constructor(private readonly stressTrackingService: StressTrackingService) {}

  @Post('stress-level-record')
  @UsePipes(new ValidationPipe())
  async createStressLevelRecord(
    @Body() createStressLevelRecordDto: CreateStressLevelRecordDto,
  ) {
    try {
      const stressLevelRecord = await this.stressTrackingService.create(
        createStressLevelRecordDto,
      );
      return { success: true, data: stressLevelRecord };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file) {
    try {
      const imageUrl = await this.stressTrackingService.uploadImage(file);
      return { success: true, data: { imageUrl } };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get(':userId/stress-tracking-records')
  async getAllStressTrackingRecords(
    @Param('userId') userId: string,
    @Query('page', ParseIntPipe) page: string,
    @Query('pageSize', ParseIntPipe) pageSize: string,
  ) {
    try {
      const stressTrackingRecords =
        await this.stressTrackingService.getAllRecords(
          userId,
          +page,
          +pageSize,
        );
      return { success: true, data: stressTrackingRecords };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
