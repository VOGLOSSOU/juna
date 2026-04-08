import { Response, NextFunction, Request } from 'express';
import uploadService, { UploadFolder } from '@/services/upload.service';
import { sendSuccess } from '@/utils/response.util';
import { ValidationError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';

const VALID_FOLDERS: UploadFolder[] = ['avatars', 'meals', 'subscriptions', 'providers', 'documents'];

export class UploadController {
  /**
   * Uploader une image
   * POST /api/v1/upload/:folder
   */
  async upload(req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction): Promise<void> {
    try {
      const folder = req.params.folder as UploadFolder;

      if (!VALID_FOLDERS.includes(folder)) {
        throw new ValidationError(
          `Dossier invalide. Valeurs acceptées : ${VALID_FOLDERS.join(', ')}`,
          ERROR_CODES.INVALID_INPUT
        );
      }

      if (!req.file) {
        throw new ValidationError('Aucun fichier fourni', ERROR_CODES.INVALID_INPUT);
      }

      uploadService.validateFileSize(req.file.size);

      const result = await uploadService.uploadImage(req.file.buffer, folder, undefined, req.file.mimetype);

      sendSuccess(res, 'Image uploadée avec succès', {
        url: result.url,
        publicId: result.publicId,
        folder,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }, 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
