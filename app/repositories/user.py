from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.user import User, Role

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Fetch user by primary key, eager loading their role."""
        result = await self.db.execute(
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.role))
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email, eager loading their role."""
        result = await self.db.execute(
            select(User)
            .where(User.email == email)
            .options(selectinload(User.role))
        )
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        """Add user to database session and return loaded instance."""
        self.db.add(user)
        await self.db.flush()
        # Fetch with eager loading of role
        loaded_user = await self.get_by_id(user.id)
        if not loaded_user:
            return user
        return loaded_user

    async def update(self, user: User) -> User:
        """Update user session state and return loaded instance."""
        self.db.add(user)
        await self.db.flush()
        # Fetch with eager loading of role
        loaded_user = await self.get_by_id(user.id)
        if not loaded_user:
            return user
        return loaded_user

    async def delete(self, user: User) -> None:
        """Remove user from session."""
        await self.db.delete(user)
        await self.db.flush()

    async def get_role_by_name(self, name: str) -> Optional[Role]:
        """Fetch Role by name."""
        result = await self.db.execute(select(Role).where(Role.name == name))
        return result.scalar_one_or_none()

    async def create_role(self, role: Role) -> Role:
        """Create a new role."""
        self.db.add(role)
        await self.db.flush()
        return role
