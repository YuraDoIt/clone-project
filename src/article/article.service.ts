import { UserEntity } from '@app/user/user.entity';
import {
  HttpCode,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import { ArticleEntity } from './article.entity';
import { CreateArticleDto } from './dto/createArticle.dto';

import slugify from 'slugify';
import { UpdateArticleDto } from './dto/updateArticle.dto';
import { ArticleResponseInterface } from './types/articleResponse.interface';
import { ArticlesResponseInterface } from './types/articlesResponse.interface';
import { FollowEntity } from '@app/profile/followers.entity';
import { queryInterface } from './types/query.interface';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async getAllArticle(query: any, currentUserId: number): Promise<any> {
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    queryBuilder.orderBy('articles.createdAt', 'DESC');
    const articleCount = await queryBuilder.getCount();

    if (query.author) {
      const author = await this.userRepository.findOne({
        username: query.author,
      });
      queryBuilder.andWhere('articles.authorId = :id', {
        id: author.id,
      });
    }

    //by tag
    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    //limit
    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    //offset
    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    //by favorited
    if (query.favorited) {
      const author = await this.userRepository.findOne(
        {
          username: query.favorited,
        },
        { relations: ['favorites'] },
      );
      console.log('Author', author);
      const ids = author.favorites.map((el) => el.id);
      if (ids.length > 0) {
        //!NotWork
        queryBuilder.andWhere('articles.authorId IN (:...ids)', { ids });
      } else {
        queryBuilder.andWhere('1=0');
      }
    }

    let favoritedIds: number[] = [];
    if (currentUserId) {
      const currentUser = await this.userRepository.findOne(currentUserId, {
        relations: ['favorites'],
      });
      favoritedIds = currentUser.favorites.map((favorite) => favorite.id);
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFavorites = articles.map((article) => {
      const favorited = favoritedIds.includes(article.id);
      return { ...article, favorited };
    }); //!cannot get favorited(true|false)

    return { articles: articlesWithFavorites, articleCount };
  }

  async getFeed(
    currentUserId: number,
    query: queryInterface,
  ): Promise<ArticlesResponseInterface> {
    const follows = await this.followRepository.find({
      followerId: currentUserId,
    });
    if (follows.length === 0) {
      return { article: [], articlesCount: 0 };
    }
    console.log(currentUserId);

    const followingUserIds = follows.map((follow) => follow.followingId);
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followingUserIds });

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { article: articles, articlesCount };
  }

  async createArticle(
    currentUser: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);

    if (!article.tagList) {
      article.tagList = [];
    }
    const randomSlug = this.processSlugUnique(article.title);
    this.checkArticleIfExistBySlug(randomSlug);
    article.slug = randomSlug;

    article.author = currentUser;

    return await this.articleRepository.save(article);
  }

  async getArticleBySlug(slugArticle: string): Promise<ArticleEntity> {
    const articleFinded = await this.articleRepository.findOne({
      slug: slugArticle,
    });
    return articleFinded;
  }

  async checkArticleIfExistBySlug(slugArticle: string): Promise<any> {
    try {
      const slugObjInDb = await this.articleRepository.findOne({
        slug: slugArticle,
      });
      if (slugObjInDb.slug != slugArticle) {
        return '';
      } else {
        throw new HttpException(
          'This article has already registered',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (err) {
      return '';
    }
  }

  async deleteArticle(
    slugArticle: string,
    currentUserId: number,
  ): Promise<DeleteResult> {
    const article = await this.getArticleBySlug(slugArticle);
    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    }

    if (article.author.id != currentUserId) {
      throw new HttpException(
        'You are not author ot this article',
        HttpStatus.I_AM_A_TEAPOT,
      );
    }
    return await this.articleRepository.delete({ slug: slugArticle });
  }

  async updateArticle(
    slug: string,
    currentUserId: number,
    updateDtoArticle: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.getArticleBySlug(slug);
    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    }

    if (article.author.id != currentUserId) {
      throw new HttpException(
        'You are not author ot this article',
        HttpStatus.I_AM_A_TEAPOT,
      );
    }
    console.log(updateDtoArticle);
    Object.assign(article, updateDtoArticle);
    console.log(article);
    return await this.articleRepository.save(article);
  }

  buildArticleResponse(article: ArticleEntity) {
    return { article };
  }

  async addArticleToFavorite(userId: number, slug: string): Promise<any> {
    const article = await this.getArticleBySlug(slug);
    const user = await this.userRepository.findOne(userId, {
      relations: ['favorites'],
    });
    console.log('user', user);
    //!Check if post is liked
    const isNotFavorited =
      user.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favoritesCount += 1;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async removeFromFavorites(
    userId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.getArticleBySlug(slug);
    const user = await this.userRepository.findOne(userId, {
      relations: ['favorites'],
    });

    const articleIndex = user.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount -= 1;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  processSlugUnique(title: string): string {
    const slugString = ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
    return (
      slugify(title, {
        lower: true,
      }) +
      '-' +
      slugString
    );
  }
}
