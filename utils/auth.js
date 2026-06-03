import jwt from 'jsonwebtoken';

import { jwtSecret } from '../config/env.js';

export function tokenFor(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
}
