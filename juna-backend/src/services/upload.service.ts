import cloudinary from '@/config/cloudinary';
import { ValidationError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';

export type UploadFolder = 'avatars' | 'meals' | 'subscriptions' | 'providers' | 'documents';

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB par défaut

export class UploadService {
  /**
   * Uploader une image sur Cloudinary
   */
  async uploadImage(
    fileBuffer: Buffer,
    folder: UploadFolder,
    filename?: string
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: `juna/${folder}`,
        allowed_formats: ALLOWED_FORMATS,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      };

      if (filename) {
        uploadOptions.public_id = filename;
        uploadOptions.overwrite = true;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new ValidationError(
              'Erreur lors de l\'upload de l\'image',
              ERROR_CODES.INVALID_INPUT
            ));
            return;
          }
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Supprimer une image de Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  /**
   * Valider la taille du fichier
   */
  validateFileSize(sizeInBytes: number): void {
    if (sizeInBytes > MAX_FILE_SIZE) {
      throw new ValidationError(
        `Fichier trop volumineux. Taille maximum : ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        ERROR_CODES.INVALID_INPUT
      );
    }
  }
}

export default new UploadService();
