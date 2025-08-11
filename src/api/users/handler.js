import autoBind from "auto-bind";

export class UsersHandler{
  constructor(service, validator) {
    this._service = service;
    this._validator = validator

    autoBind(this)
  }

  async postUserHandler(request, h) {
    try {
      const { name, position, username, password} = request.payload;
      this._validator.validateUserPayload({ name, position, username, password });

      const { id, logId } = await this._service.addUserService({ name, position, username, password })
    
      return h.response({
        status: "success",
        data: {
          id, 
          logId
        }
      }).code(201)
    } catch(error) {
      throw error
    }
  }

  async getUsersHandler(request) {
    try {
      const { position, role, page = 1, limit = 10 } = request.query;

      const data = await this._service.getAllUsers({ position, role, page, limit });

      return {
        status: "success",
        data
      }
    } catch(error) {
      throw error;
    }
  }

  async putUserHandler(request) {
    try {
      const {name, position, username, password} = request.payload;
      const { targetId } = request.params;

      await this._validator.validateUserPayload({ name, position, username, password });
      const { id: userId } = request.auth.credentials;
      await this._service.verifyUser({ userId });

      const { id, logId } = await this._service.editUser({targetId, name, position, username, password, userId});

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

  async deleteUserHandler(request) {
    try {
      const { targetId } = request.params;
      const { id: userId } = request.auth.credentials;
      await this._service.verifyUser({ userId });

      const { id, logId} = await this._service.deleteUser({ userId, targetId });

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
}