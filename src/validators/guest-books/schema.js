import Joi from 'joi';

export const GuestBookPayloadSchema = Joi.object({
  address: Joi.string().required(),
  purpose: Joi.string().required(),
  institution: Joi.string().required(),
  contactInfo: Joi.string().required(),
  members: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
      })
    )
    .required(),
});
