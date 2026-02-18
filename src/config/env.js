import dotenv from 'dotenv';

dotenv.config();

function getRequired(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT || 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  MYSQL_HOST: getRequired('MYSQL_HOST'),
  MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
  MYSQL_USER: getRequired('MYSQL_USER'),
  MYSQL_PASSWORD: getRequired('MYSQL_PASSWORD'),
  MYSQL_DATABASE: getRequired('MYSQL_DATABASE'),
  ACCESS_TOKEN_SECRET: getRequired('ACCESS_TOKEN_SECRET'),
  REFRESH_TOKEN_SECRET: getRequired('REFRESH_TOKEN_SECRET'),
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
};
