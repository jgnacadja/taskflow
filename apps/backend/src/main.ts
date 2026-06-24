import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { configureApp } from './config'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()

  app.use(cookieParser())
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
  )
  app.useGlobalFilters(new HttpExceptionFilter())

  configureApp(app)

  const port = parseInt(process.env.BACKEND_PORT ?? '3001', 10)
  await app.listen(port, '0.0.0.0')
}

void bootstrap()
