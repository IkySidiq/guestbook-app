import Joi from 'joi';

export const ReservationPayloadSchema = Joi.object({
  name: Joi.string().required(),
  contactInfo: Joi.string().required(),
  purpose: Joi.string().required(),
  institution: Joi.string().required(),
  reservationDate: Joi.date().iso().required(),
  address: Joi.string().required(),
});
