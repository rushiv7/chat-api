import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket } from "socket.io";

@WebSocketGateway()
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;

  private logger: Logger = new Logger('MessagesGateway');
  nicknames: Map<string, string> = new Map();
  CLIENT = [];

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    client.server.emit('users-changed', { user: this.nicknames[client.id], event: 'left' });
    this.nicknames.delete(client.id);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, message): void {
    this.logger.log(client.id, "Socket");
    this.server.emit('message', message);
  }

  @SubscribeMessage('set-nickname')
  setNickname(client: Socket, nickname: string) {
    console.log(nickname, "Nickname");
    // console.log(client, "Socket");

    this.nicknames[client.id] = nickname;
    this.CLIENT.push(client.id);
    console.log(this.CLIENT);
    
    client.server.emit('users-changed', { user: nickname, event: 'joined' });
  }

  @SubscribeMessage('add-message')
  addMessage(client: Socket, message) {
    console.log(message, "Message");
    // console.log(client, "Socket");

    // EMMIT TO SPECIFIC CLIENT
    this.server.sockets.to(this.CLIENT[1]).emit('message', { text: message.text, from: this.nicknames[client.id], created: new Date() });

    // EMMIT TO SELF
    this.server.sockets.to(this.CLIENT[0]).emit('message', { text: message.text, from: this.nicknames[client.id], created: new Date() });
    
    // EMMIT TO EVERYONE
    // client.server.emit('message', { text: message.text, from: this.nicknames[client.id], created: new Date() });
  }
}