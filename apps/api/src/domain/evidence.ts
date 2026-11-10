import sharp from 'sharp';
import { AppError } from '../errors.js';
import type { EvidenceReview } from '@stakeup/contracts';
export interface VerificationProvider {
  review(image: Buffer, requirements: string): Promise<EvidenceReview>;
}
export class MockVerificationProvider implements VerificationProvider {
  async review(_image: Buffer, _requirements: string): Promise<EvidenceReview> {
    return {
      provider: 'development-mock-v1',
      observations: [
        'A decodable photo was received. This mock does not analyze its visual contents.',
      ],
      unverified: [
        'Relevance to the evidence requirements has not been verified.',
        'A photo cannot establish completion, capture time, or who performed an action.',
      ],
      recommendation: 'peer_review',
    };
  }
}
export async function normalizePhoto(input: Buffer) {
  if (!input.length || input.length > 2_500_000)
    throw new AppError(400, 'Choose a photo smaller than 2.5 MB.');
  try {
    const image = sharp(input, {
      limitInputPixels: 24_000_000,
      animated: false,
      failOn: 'warning',
    });
    const meta = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format ?? '') || (meta.pages ?? 1) > 1)
      throw new Error('format');
    return await image
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throw new AppError(
      400,
      'Use a valid, non-animated JPEG, PNG or WebP photo (up to 24 megapixels).',
    );
  }
}
