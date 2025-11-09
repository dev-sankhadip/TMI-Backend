import * as dotenv from 'dotenv';
dotenv.config();

class Config {
  public readonly corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  };

  public readonly jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
  public readonly jwtRefreshSecret =
    process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret';
}

export default new Config();
