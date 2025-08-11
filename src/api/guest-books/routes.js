export const routes = (handler) => [
  {
    method: 'POST',
    path: '/guest-book',
    handler: handler.postGuestBookHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
  {
    method: 'GET',
    path: '/guest-book',
    handler: handler.getGuestBookHandler,
  },
    {
    method: 'GET',
    path: '/guest-book/{targetId}',
    handler: handler.getGuestBookByIdHandler,
  },
  {
    method: 'PUT',
    path: '/guest-book/{targetId}',
    handler: handler.editGuestBookHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/guest-book/{targetId}',
    handler: handler.deleteGuestBookHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
  {
    method: 'PATCH',
    path: '/guest-book/{targetId}/finish',
    handler: handler.finishGuestBookHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
  {
    method: 'POST',
    path: '/guest-book/{id}/members/bulk',
    handler: handler.addGuestMembersBulkHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
];
