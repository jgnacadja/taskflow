import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AuthModule } from './auth/auth.module'
import { GatewayModule } from './gateway/gateway.module'
import { HealthController } from './health/health.controller'
import { ListsModule } from './lists/lists.module'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    ListsModule,
    GatewayModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
