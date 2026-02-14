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
            # Mark as online in DB
            await self.update_user_status(True)
            
            # Join a general "presence" group
            await self.channel_layer.group_add("presence_tracking", self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            # Mark as offline and set last_seen
            await self.update_user_status(False)
            await self.channel_layer.group_discard("presence_tracking", self.channel_name)

    @database_sync_to_async
    def update_user_status(self, is_online):
        User.objects.filter(id=self.user.id).update(
            is_online_status=is_online,
            last_seen=timezone.now() if not is_online else self.user.last_seen,
            last_activity=timezone.now() # Keep your old activity tracker in sync
        )
        
        
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.thread_group_name = f'chat_{self.thread_id}'
        self.user = self.scope["user"]

        if self.user.is_authenticated:
            # Join the specific thread room
            await self.channel_layer.group_add(
                self.thread_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        # Leave the room
        await self.channel_layer.group_discard(
            self.thread_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get('message')

        if content:
            # Save message to DB
            saved_msg = await self.save_message(content)
            
            # Broadcast message to the group
            await self.channel_layer.group_send(
                self.thread_group_name,
                {
                    'type': 'chat_message',
                    'message': saved_msg
                }
            )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))

    @database_sync_to_async
    def save_message(self, content):
        thread = Thread.objects.get(id=self.thread_id)
        msg = Message.objects.create(
            thread=thread,
            sender=self.user,
            content=content
        )
        # Return a dictionary that matches your frontend expectations
        return {
            'id': msg.id,
            'content': msg.content,
            'sender_username': msg.sender.username,
            'created_at': msg.created_at.isoformat(),
            'is_read': msg.is_read
        }