export const routes = (handler) => [
  {
    method: 'POST',
    path: '/reservations',
    handler: handler.postReservationHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
  {
    method: 'GET',
    path: '/reservations',
    handler: handler.getReservationsHandler,
  },
  {
    method: 'GET',
    path: '/reservations/{id}',
    handler: handler.getReservationByIdHandler,
  },
  {
    method: 'PUT',
    path: '/reservations/{id}',
    handler: handler.editReservationHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/reservations/{id}',
    handler: handler.deleteReservationHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
  {
    method: 'POST',
    path: '/reservations/{id}/visited',
    handler: handler.markAsVisitedHandler,
    options: {
      auth: 'bukutamu_jwt',
    },
  },
];
