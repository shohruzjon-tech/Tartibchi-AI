import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, DOCUMENT_PATTERNS, UserRole } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  /**
   * Upload a file for an employee.
   * Category is passed as a query parameter to avoid multipart body parsing issues.
   * POST /documents/upload/:userId?category=contract
   */
  @Post('upload/:userId')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/webp',
          'text/plain',
        ];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  async upload(
    @Param('userId') userId: string,
    @Query('category') category: string,
    @UploadedFile() file: any, // Express.Multer.File
    @CurrentUser('tenantId') tenantId: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file provided or file type is not allowed',
      );
    }

    return firstValueFrom(
      this.accountsClient.send(DOCUMENT_PATTERNS.CREATE, {
        userId,
        tenantId,
        originalName: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        category: category || 'other',
      }),
    );
  }

  /** List all documents for an employee */
  @Get('user/:userId')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async findByUser(@Param('userId') userId: string) {
    return firstValueFrom(
      this.accountsClient.send(DOCUMENT_PATTERNS.FIND_BY_USER, { userId }),
    );
  }

  /** Delete a document by ID (also removes the physical file) */
  @Delete(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async remove(@Param('id') id: string) {
    const doc = await firstValueFrom(
      this.accountsClient.send(DOCUMENT_PATTERNS.DELETE, { id }),
    );
    // Best-effort physical file cleanup
    try {
      const filePath = join(UPLOAD_DIR, doc.fileName);
      if (existsSync(filePath)) unlinkSync(filePath);
    } catch {
      // File may already be removed
    }
    return doc;
  }
}
