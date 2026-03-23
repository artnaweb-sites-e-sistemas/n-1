const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') })

module.exports.secret = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  db_url: process.env.MONGO_URI,
  token_secret: process.env.TOKEN_SECRET,
  jwt_secret_for_verify: process.env.JWT_SECRET_FOR_VERIFY,

  email_service: process.env.SERVICE,
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,
  email_host: process.env.HOST,
  email_port: process.env.EMAIL_PORT, 

  cloudinary_name: process.env.CLOUDINARY_NAME, 
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY, 
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET, 
  cloudinary_upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET, 
  
  stripe_key: process.env.STRIPE_KEY, 
  mercado_pago_client_id: (process.env.MERCADO_PAGO_CLIENT_ID || "").trim(),
  mercado_pago_client_secret: (process.env.MERCADO_PAGO_CLIENT_SECRET || "").trim(),
  mercado_pago_access_token: (process.env.MERCADO_PAGO_ACCESS_TOKEN || "").trim(),
  mercado_pago_public_key: (process.env.MERCADO_PAGO_PUBLIC_KEY || "").trim(),
  client_url: process.env.STORE_URL, 
  admin_url:process.env.ADMIN_URL, 
}
