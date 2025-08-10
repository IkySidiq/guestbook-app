import { InvariantError } from '../../exceptions/InvariantError.js';
import { ReservationPayloadSchema } from './schema.js';

export const ReservationsValidator = {
  validateReservationPayload: (payload) => {
    const validationResult = ReservationPayloadSchema.validate(payload);

    if (validationResult.error) {
      console.log("Kesalahan pada validasi reservation payload");
      throw new InvariantError(validationResult.error.message);
    }
  },
};
