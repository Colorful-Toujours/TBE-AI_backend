import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AI Ledger API')
    .setDescription(
      'AI Ledger 后端 REST API。多数接口返回 `{ success, data }`；登录/注册返回扁平 `{ token, user }`。',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'POST /auth/login 返回的 token',
      },
      'access-token',
    )
    .addTag('health', '健康检查')
    .addTag('auth', '认证与个人资料')
    .addTag('users', '系统用户')
    .addTag('materials', '材料库')
    .addTag('bills', '账单')
    .addTag('payments', '支付记录')
    .addTag('dashboard', '仪表盘')
    .addTag('audit-logs', '操作日志')
    .addTag('roles', '角色与权限')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });
}
