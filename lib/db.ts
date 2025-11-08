// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient, ServerApiVersion, Db } from "mongodb"
 
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}
 
const uri = process.env.MONGODB_URI
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}
 
let client: MongoClient
let clientPromise: Promise<MongoClient>
 
if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient
    _mongoClientPromise?: Promise<MongoClient>
  }
 
  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = globalWithMongo._mongoClient.connect()
  }
  client = globalWithMongo._mongoClient
  clientPromise = globalWithMongo._mongoClientPromise!
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}
 
// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.
export default client

// Helper to get database instance
export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db()
}

// Collection names as constants
export const Collections = {
  USERS: 'users',
  ACCOUNTS: 'accounts',
  SESSIONS: 'sessions',
  VERIFICATION_TOKENS: 'verification_tokens',
  ROCKET_REACH_SETTINGS: 'rocketreach_settings',
  LEADS: 'leads',
  LEAD_LISTS: 'lead_lists',
  LEAD_SEARCHES: 'lead_searches',
  API_USAGE: 'api_usage',
  AUDIT_LOGS: 'audit_logs',
  ORGANIZATIONS: 'organizations',
} as const
