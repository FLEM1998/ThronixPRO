import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock the storage module
jest.mock('../../server/storage', () => ({
  storage: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    getUser: jest.fn(),
  },
}));

import { storage } from '../../server/storage';

const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Authentication Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Simple auth routes for testing
    app.post('/api/register', async (req, res) => {
      try {
        const { email, password, username } = req.body;
        
        // Check if user exists
        const existingUser = await mockStorage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await mockStorage.createUser({
          email,
          username,
          password: hashedPassword,
        });

        // Generate token
        const token = jwt.sign({ userId: user.id }, 'test-jwt-secret');
        
        res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
      } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
      }
    });

    app.post('/api/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        const user = await mockStorage.getUserByEmail(email);
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, 'test-jwt-secret');
        res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
      } catch (error) {
        res.status(500).json({ error: 'Login failed' });
      }
    });
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      mockStorage.getUserByEmail.mockResolvedValue(null);
      mockStorage.createUser.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should reject registration with existing email', async () => {
      mockStorage.getUserByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'existing',
        password: 'hash',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('POST /api/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockStorage.getUserByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject login with invalid email', async () => {
      mockStorage.getUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});