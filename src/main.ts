import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * 开启全局 DTO 参数校验。
   *
   * whitelist: true
   *   自动移除 DTO 中没有声明的字段，例如前端多传了 role/isAdmin，不会进入业务层。
   *
   * forbidNonWhitelisted: true
   *   如果前端传了 DTO 没声明的字段，直接返回 400，而不是静默移除。
   *
   * transform: true
   *   把普通 JSON 对象转换成 DTO class 实例，这样 class-validator 才能稳定工作。
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3002);
}

bootstrap().catch((error) => {
  // 启动阶段如果端口被占用、模块初始化失败等，会走到这里，方便在控制台看到原因。
  console.error('Nest application failed to start:', error);
  process.exit(1);
});
