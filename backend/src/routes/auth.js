import express from "express"
import bcrypt from "bcryptjs"
import { User } from "../models/User.js"
import { generateToken } from "../middleware/auth.js"

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, role = "viewer" } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: ["admin", "editor", "viewer"].includes(role) ? role : "viewer",
      tenant: "default",
    })

    // Generate token
    const token = generateToken(user)

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
      },
      token,
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({ error: "Registration failed" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate token
    const token = generateToken(user)

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
})

export default router
