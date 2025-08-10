export const routes = (handler) => [
  {
    method: 'POST',
    path: '/users',
    handler: handler.postUserHandler,
  },
  {
    method: 'GET',
    path: '/users',
    handler: handler.getUsersHandler,
  },
  {
    method: 'PUT',
    path: '/users/{targetId}',
    handler: handler.putUserHandler,
    options: {
      auth: 'bukutamu_jwt'
    }
  },
  {
    method: 'DELETE',
    path: '/users/{targetId}',
    handler: handler.deleteUserHandler,
    options: {
      auth: 'bukutamu_jwt'
    }
  },
];