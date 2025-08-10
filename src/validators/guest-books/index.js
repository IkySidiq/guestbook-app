import { InvariantError } from '../../exceptions/InvariantError.js';
import { GuestBookPayloadSchema } from './schema.js';
 
export const GuestBookValidator = {
  validateGuestBookPayload: (payload) => {
    const validationResult = GuestBookPayloadSchema.validate(payload);
 
    if (validationResult.error) {
      console.log("Kesalahan pada validate Guest Books payload");
      throw new InvariantError(validationResult.error.message);
    }
  },
};