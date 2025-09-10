// src/services/implements/user.service.ts
import { UserRepository } from '../../repositories/implements/user.repository';
import { Types } from 'mongoose';

export class UserService {
  constructor(private readonly userRepo = new UserRepository()) {}

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid user id');
  }

  private validateUsername(username: string) {
    const val = (username ?? '').trim();
    if (val.length < 3) throw new Error('Username must be at least 3 characters');
    if (val.length > 30) throw new Error('Username is too long');
    // optional: enforce allowed chars
    // if (!/^[a-zA-Z0-9._-]+$/.test(val)) throw new Error('Invalid characters in username');
    return val;
  }

  async updateMyUsername(userId: string, username: string) {
    this.validateObjectId(userId);
    const newUsername = this.validateUsername(username);

    // Use findByIdAndUpdate with runValidators and unique index on username
    const updated = await (this.userRepo as any).model.findByIdAndUpdate(
      userId,
      { $set: { username: newUsername } },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    if (!updated) throw new Error('User not found');
    return updated.toObject();
  }
}
