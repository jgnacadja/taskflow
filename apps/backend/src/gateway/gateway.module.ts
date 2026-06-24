import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ListsModule } from '../lists/lists.module'
import { EventsGateway } from './events.gateway'
import { WsJwtGuard } from './ws-jwt.guard'

@Module({
  imports: [AuthModule, ListsModule],
  providers: [EventsGateway, WsJwtGuard]
})
export class GatewayModule {}
