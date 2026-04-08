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
    filename?: string,
    mimetype: string = 'image/jpeg'
  ): Promise<{ url: string; publicId: string }> {
    const uploadOptions: any = {
      folder: `juna/${folder}`,
      allowed_formats: ALLOWED_FORMATS,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      resource_type: 'image',
    };

    if (filename) {
      uploadOptions.public_id = filename;
      uploadOptions.overwrite = true;
    }

    const dataUri = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;

    try {
      const result = await cloudinary.uploader.upload(dataUri, uploadOptions);
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      console.error('Cloudinary upload error:', JSON.stringify(error));
      throw new ValidationError(
        error?.message ?? 'Erreur lors de l\'upload de l\'image',
        ERROR_CODES.INVALID_INPUT
      );
    }
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
