import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, address, role, accountBalance } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user with PostgreSQL
        await User.create({ 
            name, 
            email, 
            password: hashedPassword, 
            phoneNumber, 
            address, 
            role, 
            accountBalance 
        });
        
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) return res.status(400).json({ message: "Invalid email" });

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: "24h" });

        res.json({ 
            token, 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        // Find user by ID, excluding password
        const user = await User.findByIdWithoutPassword(req.user.id);
        
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phoneNumber, address } = req.body;

    const existing = await User.findById(userId);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    // Preserve role and account balance; only update allowed fields
    const updated = await User.update(userId, {
      name: name ?? existing.name,
      email: email ?? existing.email,
      phoneNumber: phoneNumber ?? existing.phone_number,
      address: address ?? existing.address,
      role: existing.role,
      accountBalance: existing.account_balance,
    });

    const safeUser = await User.findByIdWithoutPassword(updated.id);
    res.status(200).json({ message: 'Profile updated', user: safeUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
