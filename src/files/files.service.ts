import { Injectable } from '@nestjs/common';
import { CreateFileDto } from '@/files/dto/create-file.dto';
import { UpdateFileDto } from '@/files/dto/update-file.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import type { Multer } from 'multer';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { FileEntity } from '@/files/entities/file.entity';

@Injectable()
export class FilesService {
  private supabaseClient: SupabaseClient;
  private readonly bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const supabaseNameBucket = this.configService.get<string>('SUPABASE_NAME_BUCKET');

    if (!supabaseUrl || !supabaseKey || !supabaseNameBucket) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    this.bucketName = supabaseNameBucket;
  }


  async uploadFile(folder: string, file: Express.Multer.File, userId?: string,): Promise<FileEntity> {
    try {
      const fileExtension = extname(file.originalname);

      const originalName = file.originalname
        .replace(fileExtension, '') // bỏ phần extension
        .replace(/\s+/g, '-') // space -> "-"
        .toLowerCase(); // chuyển về lowercase

      // uuid + tên file gốc
      const fileName = `${randomUUID()}_${originalName}${fileExtension}`;

      // đảm bảo folder không có dấu / đầu hoặc cuối để tránh lỗi đường dẫn
      console.log('folder trước khi xử lý:', folder);
      const sanitizedFolder = folder.trim()
        .replace(/^\/+/, '')   // bỏ dấu / đầu
        .replace(/\/+$/, '');  // bỏ dấu / cuối

      // ví dụ: users/avatar/uuid_avatar.png
      const filePath = `${sanitizedFolder}/${fileName}`;

      /*Upload file lên Supabase Storage*/
      const { data, error } = await this.supabaseClient.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Error uploading file to Supabase Storage:', error);
        throw new Error(error.message);
      }

      /*Lấy public URL để frontend đọc file*/
      const { data: publicUrl } = this.supabaseClient.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      /*Lưu metadata vào bảng File trong Prisma*/
      const savedFile = await this.prisma.file.create({
        data: {
          fileName,
          originalName: file.originalname,
          path: data.path,
          mimeType: file.mimetype,
          size: file.size,
          bucket: this.bucketName,
          userId,
        },
      });

      /*Return cho client*/
      return plainToInstance(FileEntity, {
        ...savedFile,
        fileUrl: publicUrl.publicUrl,
      });
    } catch (error: any) {
      throw new Error('Error uploading file', error.message);
    }
  }

  async uploadSingleFile(
    folder: string,
    fixedFileName: string, /*Tên file cố định, ví dụ: "avatar_userId" để mỗi user có 1 avatar duy nhất*/
    file: Express.Multer.File,
    userId?: string,
  ): Promise<FileEntity> {
    try {
      // Lấy extension từ file upload
      const fileExtension = extname(file.originalname);

      const fileName = `${fixedFileName}${fileExtension}`;

      // sanitize folder tránh lỗi path
      const sanitizedFolder = folder
        .trim()
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');

      // path cố định → upsert mới có ý nghĩa
      const filePath = `${sanitizedFolder}/${fileName}`;

      const { data, error } =
        await this.supabaseClient.storage
          .from(this.bucketName)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true, // cho phép ghi đè file nếu đã tồn tại (với path cố định thì sẽ luôn là ghi đè)
          });

      if (error) {
        console.error(
          'Error uploading single file:',
          error,
        );
        throw new Error(error.message);
      }

      const { data: publicUrl } =
        this.supabaseClient.storage
          .from(this.bucketName)
          .getPublicUrl(filePath);

      const savedFile =
        await this.prisma.file.upsert({
          where: {
            path: data.path,
          },
          update: {
            fileName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            bucket: this.bucketName,
            userId,
          },
          create: {
            fileName,
            originalName: file.originalname,
            path: data.path,
            mimeType: file.mimetype,
            size: file.size,
            bucket: this.bucketName,
            userId,
          },
        });

      return plainToInstance(FileEntity, {
        ...savedFile,
        fileUrl: publicUrl.publicUrl,
      });
    } catch (error: any) {
      console.error(error);

      throw new Error(
        `Upload single file failed: ${error.message}`,
      );
    }
  }
}
