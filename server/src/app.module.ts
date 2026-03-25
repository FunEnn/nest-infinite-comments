import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ArticlesModule } from './articles/articles.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [DatabaseModule, ArticlesModule, CommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
