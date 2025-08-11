import autoBind from "auto-bind";

export class ReservationsHandler{
  constructor(service, usersService, validator) {
      this._service = service;
      this._usersService = usersService;
      this._validator = validator;
  
      autoBind(this)
  }

  async postReservationHandler(request, h) {
    try{
      const { name, contactInfo, purpose, institution, reservationDate, address } = request.payload;
      await this._validator.validateReservationPayload({ name, contactInfo, purpose, institution, reservationDate, address });

      const { id: userId } = request.auth.credentials;
      const { id, logId } = await this._service.addReservation({ userId, name, contactInfo, purpose, institution, reservationDate, address })
    
    return h.response({
      status: 'success',
      data: {
        id,
        logId
      }
    }).code(201);
    } catch(error) {
      throw error
    }
  }

  async getReservationsHandler(request) {
    try{
      const { status, page = 1, limit = 10 } = request.query;
     
      const data = await this._service.getReservations({ status, page, limit });
      return {
        status: "success",
        data
      }
    } catch(error) {
      throw error;
    }
  }

  async getReservationByIdHandler(request) {
    try {
      const { id: targetId } = request.params;
      const { data } = await this._service.getReservationById({ targetId });

      return {
        status: "success",
        data
      }
    } catch(error) {
      throw error;
    }
  }

  async editReservationHandler(request) {
    try{
      const { name, contactInfo, purpose, institution, reservationDate, address } = request.payload;
      await this._validator.validateReservationPayload({ name, contactInfo, purpose, institution, reservationDate, address });

      const { id: targetId } = request.params;
      const { id: userId } = request.auth.credentials;
      await this._usersService.getRole({ userId });
      await this._usersService.verifyUser({ userId });

      const { id, logId } = await this._service.editReservation({ targetId, userId, name, contactInfo, purpose, institution, reservationDate, address });

      return {
      status: "success",
      data: {
        id,
        logId
      }
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteReservationHandler(request) {
    try{
      const { id: targetId } = request.params;
      const { id: userId } = request.auth.credentials;

      await this._usersService.getRole({ userId });
      await this._usersService.verifyUser({ userId });
      
      const { id, logId } = await this._service.deleteReservation({targetId, userId});

      return {
        status: "success",
        data: {
          id,
          logId
        }
      }
    } catch(error) {
      throw error;
    }
  }

  async markAsVisitedHandler(request, h) {
    try {
      const { id: reservationId } = request.params;
      const { id: userId } = request.auth.credentials;

      await this._usersService.getRole({ userId });
      await this._usersService.verifyUser({ userId });

      const result = await this._service.markAsVisited({ reservationId, userId });

      return h.response({
        status: "success",
        data: result,
      }).code(200);
    } catch (error) {
      throw error;
    }
  }
}