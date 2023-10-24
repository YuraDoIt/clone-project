import { Controller, Get } from '@nestjs/common';
import { TagService } from '@app/tag/tag.service';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async findAllTag(): Promise<{ tags: string[] }> {
    const tags = await this.tagService.findAllTag();
    return {
      tags: tags.map((tag) => tag.name),
    };
  }
}
