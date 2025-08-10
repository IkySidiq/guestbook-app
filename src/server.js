import dotenv from 'dotenv';
dotenv.config();
import Hapi from '@hapi/hapi';
import Jwt from '@hapi/jwt';
import Inert from '@hapi/inert';
import { ClientError } from "./exceptions/ClientError.js";

//Users
import { UsersService } from './services/postgre/UsersService.js';
import { UserValidator } from './validators/users/index.js';
import { authentications } from './api/authentications/index.js';

//Auth
import { AuthenticationsService } from './services/postgre/AuthenticationsService.js';
import { AuthenticationsValidator } from './validators/authentications/index.js';
import { users } from './api/users/index.js';

//Guest Books
import { GuestBooksService } from './services/postgre/GuestBooksService.js';
import { GuestBookValidator } from './validators/guest-books/index.js';
import { guestBooks } from './api/guest-books/index.js';

//Reservations
import { ReservationsService } from './services/postgre/ReservationsService.js';
import { ReservationsValidator } from './validators/reservations/index.js';
import { reservations } from './api/reservations/index.js';

const init = async() => {
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService()
  const guestBookService = new GuestBooksService();
  const reservationsService = new ReservationsService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([Jwt, Inert]);

  server.auth.strategy('bukutamu_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UserValidator
      }
    },
    {
      plugin: authentications,
      options: {
        service: authenticationsService,
        validator: AuthenticationsValidator
      }
    },
    {
      plugin: guestBooks,
      options: {
        service: guestBookService,
        usersService,
        validator: GuestBookValidator
      }
    },
    {
      plugin: reservations,
      options: {
        service: reservationsService,
        usersService,
        validator: ReservationsValidator
      }
    }
  ]);

    server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        return h
          .response({
            status: 'fail',
            message: response.message,
          })
          .code(response.statusCode);
      }

      if (!response.isServer) {return h.continue;}

      console.error(response);
      return h
        .response({
          status: 'error',
          message: 'Maaf, terjadi kegagalan pada server kami.',
        })
        .code(500);
    }

    return h.continue;
  });

  await server.start();
  console.log(`\n✅ Server berjalan pada ${server.info.uri}`);
}

init();