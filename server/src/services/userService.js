import { hash } from 'argon2'
import { usersRepository } from '../repositories/usersRepository.js'
import { sessionsRepository } from '../repositories/sessionsRepository.js'
import { ConflictError, NotFoundError } from '../errors/AppError.js'

export const userService = {
  async createUser({ email, password, fullName, role }) {
    const existing = await usersRepository.findByEmail(email)
    if (existing) {
      throw new ConflictError(`A user with email '${email}' already exists`)
    }

    const passwordHash = await hash(password)
    return usersRepository.create({
      email,
      passwordHash,
      fullName,
      role,
    })
  },

  async listUsers(query) {
    return usersRepository.list(query)
  },

  async toggleUserActive(id, isActive) {
    const user = await usersRepository.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const updated = await usersRepository.toggleActive(id, isActive)

    // If deactivating user, revoke all their active sessions immediately!
    if (!isActive) {
      await sessionsRepository.revokeUserSessions(id)
    }

    return updated
  },
}
