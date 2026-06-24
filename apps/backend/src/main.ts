import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()

  //enabling swagger
  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('API TaskFlow — documentation OpenAPI')
    .setVersion('0.0.1')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = Number(process.env.BACKEND_PORT ?? 3001)
  await app.listen(port, '0.0.0.0')
}

void bootstrap()
