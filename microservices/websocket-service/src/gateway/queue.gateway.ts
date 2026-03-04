import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/queue',
})
export class QueueWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QueueWebSocketGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  // ======== CLIENT SUBSCRIPTIONS ========

  /** Client joins a branch room to receive live updates */
  @SubscribeMessage('joinBranch')
  handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    client.join(`branch:${data.branchId}`);
    this.logger.debug(`Client ${client.id} joined branch:${data.branchId}`);
    return { event: 'joined', data: { branchId: data.branchId } };
  }

  /** Client leaves a branch room */
  @SubscribeMessage('leaveBranch')
  handleLeaveBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    client.leave(`branch:${data.branchId}`);
    return { event: 'left', data: { branchId: data.branchId } };
  }

  /** Client subscribes to a specific queue */
  @SubscribeMessage('joinQueue')
  handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { queueId: string },
  ) {
    client.join(`queue:${data.queueId}`);
    return { event: 'joined', data: { queueId: data.queueId } };
  }

  /** Client tracks their ticket */
  @SubscribeMessage('trackTicket')
  handleTrackTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.join(`ticket:${data.ticketId}`);
    return { event: 'tracking', data: { ticketId: data.ticketId } };
  }

  /** Staff joins counter room */
  @SubscribeMessage('joinCounter')
  handleJoinCounter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { counterId: string },
  ) {
    client.join(`counter:${data.counterId}`);
    return { event: 'joined', data: { counterId: data.counterId } };
  }

  /** TV Display joins display room */
  @SubscribeMessage('joinDisplay')
  handleJoinDisplay(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    client.join(`display:${data.branchId}`);
    return { event: 'joined', data: { room: `display:${data.branchId}` } };
  }

  // ======== SERVER-SIDE EMISSIONS (called from events controller) ========

  /** Emit queue update to all clients watching a branch */
  emitQueueUpdate(branchId: string, data: any) {
    this.server.to(`branch:${branchId}`).emit('queueUpdate', data);
  }

  /** Emit ticket called event */
  emitTicketCalled(branchId: string, data: {
    ticketId: string;
    displayNumber: string;
    counterName: string;
    counterId: string;
    queueId: string;
  }) {
    // Notify the branch (TV displays, customers watching)
    this.server.to(`branch:${branchId}`).emit('ticketCalled', data);

    // Notify the specific ticket tracker
    this.server.to(`ticket:${data.ticketId}`).emit('yourTicketCalled', data);

    // Notify the display screens
    this.server.to(`display:${branchId}`).emit('displayUpdate', {
      type: 'TICKET_CALLED',
      ...data,
    });

    // Notify the queue watchers
    this.server.to(`queue:${data.queueId}`).emit('queueUpdate', {
      type: 'TICKET_DEQUEUED',
      queueId: data.queueId,
    });
  }

  /** Emit display update (for TV screens) */
  emitDisplayUpdate(branchId: string, data: any) {
    this.server.to(`display:${branchId}`).emit('displayUpdate', data);
  }

  /** Emit counter state update */
  emitCounterUpdate(counterId: string, data: any) {
    this.server.to(`counter:${counterId}`).emit('counterUpdate', data);
  }
}
