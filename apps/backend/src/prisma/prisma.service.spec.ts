import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from './prisma.service'

describe('PrismaService', () => {
  let service: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService]
    }).compile()

    service = module.get(PrismaService)
  })

  it('calls $connect on module init', async () => {
    const spy = vi.spyOn(service, '$connect').mockResolvedValue(undefined)
    await service.onModuleInit()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('calls $disconnect on module destroy', async () => {
    const spy = vi.spyOn(service, '$disconnect').mockResolvedValue(undefined)
    await service.onModuleDestroy()
    expect(spy).toHaveBeenCalledOnce()
  })
})
