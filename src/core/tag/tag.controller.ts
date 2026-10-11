import { Controller, Get, Inject, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { IDataServices } from "@/core/repositories/data-service.repository";
import { ListTagsQueryDto } from "@/core/tag/tag.dto";
import { TagTransformer } from "@/core/transformers/tag.transformer";
import { TagResponse } from "@/core/user/dto/profile.dto";

/**
 * Справочник категорий и тегов: онбординг, выбор категории стрима, каталог.
 * Логики нет — только чтение, поэтому без отдельного use case.
 */
@Controller("tags")
@ApiTags("tags")
export class TagController {
  constructor(
    @Inject(IDataServices) private readonly dataService: IDataServices,
  ) {}

  @ApiOkResponse({ type: [TagResponse] })
  @Get()
  async list(@Query() query: ListTagsQueryDto): Promise<TagResponse[]> {
    const tags = await this.dataService.tag.list({
      kinds: query.kind,
      search: query.search?.trim() || undefined,
      limit: query.limit ?? 100,
    });
    return tags.map(TagTransformer.toResponse);
  }
}
