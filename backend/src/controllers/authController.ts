import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, department, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Determine the department based on role
    const userDepartment = role === 'agent' ? department : null; // Set department to null for employees

    // Create new user
    const user = new User({
      email,
      password,
      role,
      department: userDepartment, // Use the determined department
      firstName,
      lastName,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      department: user.department,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error: any) {
    console.error('getMe error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}; 