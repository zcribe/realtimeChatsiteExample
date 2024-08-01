import 'dotenv/config'

const PORT = process.env.PORT ?? 3000
const MONGO_URI = process.env.MONGO_URI ?? 'Add mongodb connection'
const SECRET = process.env.SECRET ?? '1234567'

export default {PORT, MONGO_URI, SECRET}; 