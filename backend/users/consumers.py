import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Thread, Message

User = get_user_model()

class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            await self.update_user_status(True)
            await self.channel_layer.group_add("presence_tracking", self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.update_user_status(False)
            await self.channel_layer.group_discard("presence_tracking", self.channel_name)

    # Handler for the "Bell" icon updates
    async def bell_notification(self, event):
        if str(self.user.id) == event["recipient_id"]:
            await self.send(text_data=json.dumps({
                "type": "UPDATE_BELL_COUNT",
                "message": event["message"]
            }))

    async def task_notification(self, event):
        if str(self.user.id) == event["recipient_id"]:
            await self.send(text_data=json.dumps({
                "type": "NEW_TASK_ASSIGNED",
                "message": event["message"],
                "mentor": event["mentor_name"]
            }))

    @database_sync_to_async
    def update_user_status(self, is_online):
        User.objects.filter(id=self.user.id).update(
            is_online_status=is_online,
            last_seen=timezone.now() if not is_online else self.user.last_seen,
            last_activity=timezone.now()
        )

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.thread_group_name = f'chat_{self.thread_id}'
        self.user = self.scope["user"]

        if self.user.is_authenticated:
            await self.channel_layer.group_add(self.thread_group_name, self.channel_name)
            await self.accept()
            # Mark messages as read the moment we join the chat
            await self.mark_messages_as_read()
            # Notify the other person that we've seen their messages
            await self.channel_layer.group_send(
                self.thread_group_name, {"type": "messages_read_receipt"}
            )
        else:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.thread_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        # FIX: Keep user online when they interact with chat
        await self.heartbeat_activity()

        # Handle explicit "I have read these" signal from frontend
        if data.get('type') == 'read_messages':
            await self.mark_messages_as_read()
            await self.channel_layer.group_send(
                self.thread_group_name, {"type": "messages_read_receipt"}
            )
            return

        content = data.get('message')
        if content:
            saved_msg = await self.save_message(content)
            await self.channel_layer.group_send(
                self.thread_group_name, {'type': 'chat_message', 'message': saved_msg}
            )

    async def chat_message(self, event):
        message = event['message']
        # Also mark as read if the recipient is currently connected to this socket
        # This handles the "I'm looking at the screen while you type" blue tick
        if message['sender_username'] != self.user.username:
            await self.mark_messages_as_read()
            # Send a signal back to the sender that it was seen immediately
            await self.channel_layer.group_send(
                self.thread_group_name, {"type": "messages_read_receipt"}
            )

        await self.send(text_data=json.dumps({
            'message': message
        }))

    # Handler for the Blue Ticks
    async def messages_read_receipt(self, event):
        await self.send(text_data=json.dumps({'type': 'MESSAGES_READ'}))

    @database_sync_to_async
    def heartbeat_activity(self):
        User.objects.filter(id=self.user.id).update(
            is_online_status=True, last_activity=timezone.now()
        )

    @database_sync_to_async
    def mark_messages_as_read(self):
        Message.objects.filter(
            thread_id=self.thread_id, is_read=False
        ).exclude(sender=self.user).update(is_read=True)

    @database_sync_to_async
    def save_message(self, content):
        thread = Thread.objects.get(id=self.thread_id)
        msg = Message.objects.create(thread=thread, sender=self.user, content=content)
        return {
            'id': msg.id,
            'content': msg.content,
            'sender_username': msg.sender.username,
            'created_at': msg.created_at.isoformat(),
            'is_read': msg.is_read
        }