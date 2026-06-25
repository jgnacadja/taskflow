import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { ListsService } from '../lists/lists.service'
import { EventsGateway } from './events.gateway'

const mockJwtService = { verify: vi.fn() }
const mockListsService = { findOne: vi.fn() }

function makeClient(token?: string, overrides: Record<string, unknown> = {}): Socket {
  return {
    id: 'socket-id',
    handshake: { auth: token ? { token } : {}, headers: {} },
    data: {},
    disconnect: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    ...overrides
  } as unknown as Socket
}

describe('EventsGateway', () => {
  let gateway: EventsGateway
  const mockServer = { to: vi.fn(), emit: vi.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ListsService, useValue: mockListsService }
      ]
    }).compile()

    gateway = module.get(EventsGateway)
    ;(gateway as unknown as { server: typeof mockServer }).server = mockServer
    mockServer.to.mockReturnValue(mockServer)
    vi.clearAllMocks()
    mockServer.to.mockReturnValue(mockServer)
  })

  describe('handleConnection', () => {
    it('stores the JWT payload in client.data.user when the token is valid', () => {
      const client = makeClient('valid-token')
      const payload = { sub: 'user-1', email: 'test@example.com' }
      mockJwtService.verify.mockReturnValue(payload)

      gateway.handleConnection(client)

      expect(client.data.user).toEqual(payload)
      expect(client.disconnect).not.toHaveBeenCalled()
    })

    it('disconnects if no token is provided', () => {
      const client = makeClient()

      gateway.handleConnection(client)

      expect(client.disconnect).toHaveBeenCalledWith(true)
    })

    it('disconnects if the token is invalid', () => {
      const client = makeClient('bad-token')
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token')
      })

      gateway.handleConnection(client)

      expect(client.disconnect).toHaveBeenCalledWith(true)
    })

    it('accepts the token from the Authorization header', () => {
      const client = makeClient(undefined, {
        handshake: { auth: {}, headers: { authorization: 'Bearer header-token' } }
      })
      const payload = { sub: 'user-1', email: 'test@example.com' }
      mockJwtService.verify.mockReturnValue(payload)

      gateway.handleConnection(client)

      expect(mockJwtService.verify).toHaveBeenCalledWith('header-token')
      expect(client.disconnect).not.toHaveBeenCalled()
    })
  })

  describe('handleDisconnect', () => {
    it('does not throw', () => {
      const client = makeClient()
      expect(() => gateway.handleDisconnect(client)).not.toThrow()
    })
  })

  describe('handleJoinList', () => {
    it('joins the room if the user owns the list', async () => {
      const client = makeClient()
      client.data.user = { sub: 'user-1', email: 'test@example.com' }
      mockListsService.findOne.mockResolvedValue({ id: 'list-1', userId: 'user-1' })

      await gateway.handleJoinList(client, { listId: 'list-1' })

      expect(mockListsService.findOne).toHaveBeenCalledWith('user-1', 'list-1')
      expect(client.join).toHaveBeenCalledWith('list:list-1')
    })

    it('throws WsException if the user is not the owner', async () => {
      const client = makeClient()
      client.data.user = { sub: 'user-2', email: 'other@example.com' }
      mockListsService.findOne.mockRejectedValue(new Error('Accès refusé'))

      await expect(gateway.handleJoinList(client, { listId: 'list-1' })).rejects.toThrow(
        WsException
      )
      expect(client.join).not.toHaveBeenCalled()
    })
  })

  describe('handleLeaveList', () => {
    it('leaves the corresponding room', () => {
      const client = makeClient()

      gateway.handleLeaveList(client, { listId: 'list-1' })

      expect(client.leave).toHaveBeenCalledWith('list:list-1')
    })
  })

  describe('onTaskCreated', () => {
    it('emits task:created to the list room', () => {
      gateway.onTaskCreated({ listId: 'list-1', task: { id: 'task-1' } })

      expect(mockServer.to).toHaveBeenCalledWith('list:list-1')
      expect(mockServer.emit).toHaveBeenCalledWith('task:created', { id: 'task-1' })
    })
  })

  describe('onTaskUpdated', () => {
    it('emits task:updated to the list room', () => {
      gateway.onTaskUpdated({ listId: 'list-1', task: { id: 'task-1', title: 'updated' } })

      expect(mockServer.to).toHaveBeenCalledWith('list:list-1')
      expect(mockServer.emit).toHaveBeenCalledWith('task:updated', {
        id: 'task-1',
        title: 'updated'
      })
    })
  })

  describe('onTaskDeleted', () => {
    it('emits task:deleted to the list room', () => {
      gateway.onTaskDeleted({ listId: 'list-1', taskId: 'task-1' })

      expect(mockServer.to).toHaveBeenCalledWith('list:list-1')
      expect(mockServer.emit).toHaveBeenCalledWith('task:deleted', { id: 'task-1' })
    })
  })
})
