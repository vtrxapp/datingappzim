import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';

const TARGET_BYTES = 100 * 1024; // <100KB per photo, per the low-bandwidth design constraint
const MAX_DIMENSION = 1080;
const QUALITY_STEPS = [80, 70, 60, 50, 40, 30];

@Injectable()
export class ImageCompressionService {
  /** Resizes + re-encodes as JPEG, stepping quality down until under TARGET_BYTES (best effort). */
  async compress(input: Buffer): Promise<Buffer> {
    let base: sharp.Sharp;
    try {
      base = sharp(input).rotate().resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      });
    } catch {
      throw new BadRequestException('Uploaded file is not a valid image');
    }

    let output = await base.jpeg({ quality: QUALITY_STEPS[0], mozjpeg: true }).toBuffer();
    for (const quality of QUALITY_STEPS.slice(1)) {
      if (output.byteLength <= TARGET_BYTES) break;
      output = await sharp(input)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    return output;
  }
}
