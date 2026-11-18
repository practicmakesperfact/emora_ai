#!/usr/bin/env python3
"""
Emora — One-time migration script (Step 7)
Deletes conversations that have:
  - title == "New Conversation"
  - zero messages

Run once from the project root:
    .venv\Scripts\python.exe scripts\delete_empty_conversations.py

Safe to run multiple times (idempotent).
"""

import asyncio
import sys
from pathlib import Path

# Make sure app package is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, delete, func
from app.database.connection import AsyncSessionLocal
from app.models.conversation import Conversation, Message


async def main() -> None:
    async with AsyncSessionLocal() as db:
        # Find all "New Conversation" conversations with 0 messages
        subq = (
            select(Message.conversation_id, func.count(Message.id).label("msg_count"))
            .group_by(Message.conversation_id)
            .subquery()
        )

        result = await db.execute(
            select(Conversation)
            .outerjoin(subq, Conversation.id == subq.c.conversation_id)
            .where(
                Conversation.title == "New Conversation",
                (subq.c.msg_count == None) | (subq.c.msg_count == 0),  # noqa: E711
            )
        )
        empty = result.scalars().all()

        if not empty:
            print("✅  No empty 'New Conversation' records found — nothing to delete.")
            return

        ids = [c.id for c in empty]
        print(f"Found {len(ids)} empty conversations to delete: {ids}")

        await db.execute(
            delete(Conversation).where(Conversation.id.in_(ids))
        )
        await db.commit()
        print(f"✅  Deleted {len(ids)} empty conversations.")


if __name__ == "__main__":
    asyncio.run(main())
