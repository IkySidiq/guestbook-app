import { GuestBooksHandler } from './handler.js';
import { routes } from './routes.js';

export const guestBooks = {
  name: 'guestBooks',
  version: '1.0.0',
  register: async (server, { service, usersService, validator }) => {
    const guestBooksHandler = new GuestBooksHandler({ service, usersService, validator });
    server.route(routes(guestBooksHandler));
  },
};