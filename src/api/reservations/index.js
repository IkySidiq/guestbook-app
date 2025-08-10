import { routes } from './routes.js';
import { ReservationsHandler } from './handler.js';

export const reservations = {
  name: 'reservations',
  version: '1.0.0',
  register: async (server, { service, usersService, validator }) => {
    const reservationsHandler = new ReservationsHandler(service, usersService, validator);
    server.route(routes(reservationsHandler));
  },
};