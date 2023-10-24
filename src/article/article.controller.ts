import { UserDecorator } from '@app/user/decorators/user.decorator';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserEntity } from '@app/user/user.entity';
import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/createArticle.dto';
import { UpdateArticleDto } from './dto/updateArticle.dto';
import { ArticleResponseInterface } from './types/articleResponse.interface';
import { ArticlesResponseInterface } from './types/articlesResponse.interface';
import { Request } from 'express';
import { ArticleEntity } from './article.entity';
import { queryInterface } from './types/query.interface';
import { backendValidationPipe } from '@app/shared/pipes/backend.validation.pipe';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAllArticle(
    @UserDecorator('id') currentUserId: number,
    @Query() query: any,
  ): Promise<ArticlesResponseInterface> {
    return this.articleService.getAllArticle(query, currentUserId);
  }

  //!return all users subscribers
  @Get('feed')
  @UseGuards(AuthGuard)
  async getFeed(
    @UserDecorator('id') currentUserId: number,
    @Query() query: queryInterface,
  ): Promise<ArticlesResponseInterface> {
    return this.articleService.getFeed(currentUserId, query);
  }

  @Post('create')
  @UsePipes(new backendValidationPipe())
  @UseGuards(AuthGuard)
  async createArticle(
    @UserDecorator() currentUser: UserEntity,
    @Body('article') createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.createArticle(
      currentUser,
      createArticleDto,
    );
    return this.articleService.buildArticleResponse(article);
  }

  @Get('getArticleBySlug')
  @UseGuards(AuthGuard)
  async getBySlug(
    @Body('slug') slug: string,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.getArticleBySlug(slug);
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  async deleteArticle(
    @UserDecorator('id') currentUserId: number,
    @Param('slug') slug: string,
  ): Promise<DeleteResult> {
    return this.articleService.deleteArticle(slug, currentUserId);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  async updateArticle(
    @Param('slug') slug: string,
    @UserDecorator('id') currentUserId: number,
    @Body() updateDtoArticle: UpdateArticleDto,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.updateArticle(
      slug,
      currentUserId,
      updateDtoArticle,
    );
    return this.articleService.buildArticleResponse(article);
  }

  @Post(':slug/favorites')
  @UseGuards(AuthGuard)
  async addArticleToFavorite(
    @UserDecorator('id') userId: number,
    @Param('slug') slug: string,
  ): Promise<ArticleEntity> {
    return this.articleService.addArticleToFavorite(userId, slug);
  }

  @Delete(':slug/favorites')
  @UseGuards(AuthGuard)
  async removeArticleFromFavorite(
    @UserDecorator('id') userId: number,
    @Param('slug') slug: string,
  ): Promise<ArticleEntity> {
    return this.articleService.removeFromFavorites(userId, slug);
  }

  @Get('slug')
  async getSlug(@Req() req: Request) {
    const res = await this.articleService.processSlugUnique('Stringa');
    console.log(res);
    console.log(req);
    return res;
  }
}
