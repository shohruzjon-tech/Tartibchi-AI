import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WebSocketService');
  const httpPort = parseInt(process.env.WEBSOCKET_SERVICE_PORT || '5006', 10);

  // Create HTTP app for WebSocket server
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  // Also connect as TCP microservice to receive events from other services
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: httpPort + 100, // TCP on 5106
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpPort);
  logger.log(`WebSocket service HTTP on port ${httpPort}, TCP on port ${httpPort + 100}`);
}
bootstrap();
