import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class PasswordUtil {
  hash(password: string, salt: string): string {
    return createHash('sha256').update(`${password}.${salt}`).digest('hex');
  }

  createFields(password: string) {
    const passwordSalt = randomBytes(16).toString('hex');
    return {
      passwordSalt,
      passwordHash: this.hash(password, passwordSalt),
    };
  }
}
