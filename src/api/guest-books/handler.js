import autoBind from "auto-bind";

export class GuestBooksHandler {
  constructor ({ service, usersService, validator }) {
    this._service = service;
    this._usersService = usersService;
    this._validator = validator;

    autoBind(this)
    
  }

  async postGuestBookHandler(request, h) {
    try {
      const { address, purpose, institution, totalGuest, members, contactInfo } = request.payload;

      if (!Array.isArray(members) || members.length !== totalGuest) {
        throw new InvariantError('Jumlah anggota tidak sesuai dengan total tamu');
      }

      await this._validator.validateGuestBookPayload({ address, purpose, institution, totalGuest, contactInfo });

      const { id: userId } = request.auth;

      const { id, logId } = await this._service.addGuestBook({ userId, address, purpose, institution, totalGuest, contactInfo });

      const memberIds = [];
      for (const { name } of members) {
        const { memberId } = await this._service.addGuestMember({ guestId: id, name });
        memberIds.push(memberId);
      }

      return h.response({
        status: 'success',
        data: {
          id,
          logId,
          memberIds,
        }
      }).code(201);
    } catch(error) {
      throw error;
    }
  }

  async getGuestBookHandler(request) {
    try{
      const { status, page = 1, limit = 10 } = request.query;
     
      const data = await this._service.getGuestBooks({ status, page, limit });
      return {
        status: "success",
        data
      }
    } catch(error) {
      throw error;
    }
  }

  async getGuestBookByIdHandler(request) {
    try {
      const { id: targetId } = request.params;
      const { data } = await this._service.getBookId({ targetId });

      return {
        status: "success",
        data
      }
    } catch(error) {
      throw error;
    }
  }

  async editGuestBookHandler(request) {
    try{
      const { address, purpose, institution, totalGuest } = request.payload;
      await this._validator.guestBookValidator({ address, purpose, institution, totalGuest });
      
      const { id: targetId } = request.params;
      const { id: userId } = request.auth;
      const { role } = await this._usersService.getRole({ userId })
      await this._service.verifyUser({ role });


      const { id, logId } = await this._service.editBook({ targetId, userId, address, purpose, institution, totalGuest });

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

  
  async deleteGuestBookHandler(request) {
    try{
      const { id: targetId } = request.params;
      const { id: userId } = request.auth;

      const { role } = await this._usersService.getRole({ userId })
      await this._service.verifyUser({ role });
      
      const { id, logId } = await this._service.deleteBook({targetId, userId});

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

  async finishGuestBookHandler(request, h) {
    try {
      const { id: targetId } = request.params;
      const { id: userId } = request.auth;

      const { role } = await this._usersService.getRole({ userId });
      await this._service.verifyUser({ role });

      const { id, logId } = await this._service.finishGuestBook({ targetId, userId });

      return h.response({
        status: "success",
        data: { id, logId },
      }).code(200);
    } catch (error) {
      throw error;
    }
  }

  async addGuestMembersBulkHandler(request, h) {
    try {
      const { id: guestId } = request.params;
      const { members } = request.payload;
      const { totalGuest } = request.payload;

      if (!Array.isArray(members) || members.length !== totalGuest) {
        throw new InvariantError('Jumlah anggota tidak sesuai dengan total tamu');
      }

      await this._service.addGuestMembersBulk({ guestId, members, totalGuest });

      return h.response({
        status: "success",
        message: `${members.length} anggota tamu berhasil ditambahkan`,
      }).code(201);
    } catch (error) {
      throw error;
    }
  }
}