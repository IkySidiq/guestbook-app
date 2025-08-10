import Joi from 'joi';

export const ReservationPayloadSchema = Joi.object({
  name: Joi.string().required(),
  contact_info: Joi.string().required(),
  purpose: Joi.string().required(),
  institution: Joi.string().required(),
  reservation_date: Joi.date().iso().required(),
});
