from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user import UserRepository
from app.schemas.user import UserUpdate
from app.models.user import User
from app.core.exceptions import NotFoundException, ValidationException
from app.security.password import hash_password

class UserService:
    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)

    async def get_user_by_id(self, user_id: int) -> User:
        """Fetch user by ID. Raises NotFoundException if user is missing."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def get_user_by_email(self, email: str) -> User:
        """Fetch user by email. Raises NotFoundException if user is missing."""
        user = await self.repository.get_by_email(email)
        if not user:
            raise NotFoundException("User with this email not found")
        return user

    async def update_user(self, user_id: int, user_update: UserUpdate) -> User:
        """
        Update user attributes. Handles password hashing and email conflicts.
        """
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        # Extract data to update
        update_data = user_update.model_dump(exclude_unset=True)

        # Check if email is being updated and is already taken
        if "email" in update_data and update_data["email"] != user.email:
            existing_user = await self.repository.get_by_email(update_data["email"])
            if existing_user:
                raise ValidationException("Email already in use")

        # Hash new password if supplied
        if "password" in update_data:
            update_data["hashed_password"] = hash_password(update_data.pop("password"))

        # Apply fields
        for field, value in update_data.items():
            setattr(user, field, value)

        return await self.repository.update(user)

    async def delete_user(self, user_id: int) -> None:
        """Delete user by ID."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        await self.repository.delete(user)
