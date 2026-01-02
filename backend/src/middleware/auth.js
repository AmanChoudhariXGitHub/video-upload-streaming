import jwt from "jsonwebtoken"
import { User } from "../models/User.js"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this"

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      tenant: user.tenant,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" })
    }

    next()
  }
}

export function tenantIsolation(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" })
  }

  req.tenant = req.user.tenant
  next()
}
