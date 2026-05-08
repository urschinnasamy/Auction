import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as User from "../models/userModel.js";

const SECRET = "SECRET_KEY";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin_123";

/* ---------------- REGISTER ---------------- */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.createUser(name, email, hashedPassword);

    res.json({ msg: "User registered", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- LOGIN ---------------- */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // SUPER ADMIN
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: "super-admin", isAdmin: true },
        SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        token,
        user: {
          id: "super-admin",
          name: "Super Admin",
          email,
          isAdmin: true
        }
      });
    }

    // NORMAL USER
    const user = await User.getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, isAdmin: false },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: false
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};