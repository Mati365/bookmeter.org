import {Inject, Injectable, forwardRef} from '@nestjs/common';
import * as R from 'ramda';

import {Optional} from '@shared/types';

import {genTagLink} from '@client/routes/Links';
import {paginatedAsyncIterator} from '@server/common/helpers/db';
import {objPropsToPromise} from '@shared/helpers';

import {BookService, BookTagsService} from '@server/modules/book/services';
import {TagEntity} from '@server/modules/tag/Tag.entity';
import {LinkHydrateAttrs, hydrateTextWithLinks} from '../helpers/hydrateTextWithLinks';
import {BookEntity} from '../../../entity/Book.entity';
import {BookTagsStatsService} from '../../stats/services';
import {BookTagStatDAO} from '../../stats/dao/BookTagStat.dao';

type BookTagHydratorAttrs = Optional<Omit<LinkHydrateAttrs<BookTagStatDAO>, 'linkGeneratorFn'>, 'tags'>;

@Injectable()
export class BookTagsTextHydratorService {
  constructor(
    private readonly bookTagsStats: BookTagsStatsService,

    @Inject(forwardRef(() => BookTagsService))
    private readonly bookTags: BookTagsService,

    @Inject(forwardRef(() => BookService))
    private readonly bookService: BookService,
  ) {}

  /**
   * Injects popular tags into text
   *
   * @param {BookTagHydratorAttrs} attrs
   * @returns
   * @memberof BookTagsTextHydratorService
   */
  async hydrateTextWithPopularTags({tags, ...attrs}: BookTagHydratorAttrs) {
    if (!attrs.text)
      return null;

    const {bookTagsStats} = this;
    const popularTags = tags ?? (await bookTagsStats.findMostPopularTags());

    const hydration = hydrateTextWithLinks(
      {
        tags: popularTags,
        linkGeneratorFn: (item) => ({
          href: genTagLink(item),
          class: 'c-promo-tag-link',
          target: '_blank',
        }),
        ...attrs,
      },
    );

    if (!hydration)
      return null;

    return {
      text: hydration.text,
      tags: (hydration.tags || []).map(
        ({name, id}) => new TagEntity(
          {
            id,
            name,
          },
        ),
      ),
    };
  }

  /**
   * Reloads books descriptions
   *
   * @todo
   *  Maybe add multithread hydration?
   *
   * @param {number[]} ids
   * @memberof BookTagsTextHydratorService
   */
  async refreshBooksHydratedTags(ids: number[]) {
    const {
      bookTagsStats,
      bookTags,
      bookService,
    } = this;

    const popularTags = await bookTagsStats.findMostPopularTags();
    const {booksTags, books} = await objPropsToPromise(
      {
        booksTags: (async () => {
          const tags = await bookTags.findBooksTags(
            ids,
            [
              't."id" as "id"',
              'btt."bookId" as "bookId"',
            ],
          );

          return R.mapObjIndexed(
            R.pluck('id'),
            tags,
          );
        })(),

        books: (
          BookEntity
            .createQueryBuilder('b')
            .select(
              [
                'b.id', 'b.primaryReleaseId', 'b.description',
                'r.id', 'r.description',
              ],
            )
            .leftJoin('b.primaryRelease', 'r', 'b.primaryReleaseId = r.id')
            .whereInIds(ids)
            .getMany()
        ),
      },
    );

    // do not exec it in parallel, node is single threaded
    const updatedBooks: Record<string, {
      id: number,
      description: string,
      taggedDescription: string,
      newTags: TagEntity[],
    }> = {};

    for await (const book of books) {
      const description = book.description ?? book.primaryRelease.description;
      const hydration = await this.hydrateTextWithPopularTags(
        {
          tags: popularTags,
          text: description,
        },
      );

      if (hydration) {
        const cachedTags = booksTags[book.id];
        updatedBooks[book.id] = {
          id: book.id,
          description,
          taggedDescription: hydration.text,
          newTags: (hydration.tags || []).filter(({id}) => !cachedTags || !cachedTags.includes(id)),
        };
      }
    }

    await Promise.all(
      [
        bookService.shallowUpdate(
          R.values(updatedBooks).map(({description, taggedDescription, id}) => new BookEntity(
            {
              id,
              description,
              taggedDescription,
            },
          )),
        ),

        bookTags.appendTagsForBooks(
          R.mapObjIndexed(
            ({newTags}) => R.pluck('id', newTags),
            updatedBooks,
          ),
        ),
      ],
    );
  }

  /**
   * Rewrites descriptions of all books
   *
   * @memberof BookTagsTextHydratorService
   */
  async refreshAllBooksHydratedTags() {
    const booksIterator = paginatedAsyncIterator(
      {
        limit: 30,
        queryExecutor: ({limit, offset}) => (
          BookEntity
            .createQueryBuilder('b')
            .select('b.id')
            .offset(offset)
            .limit(limit)
            .getMany()
        ),
      },
    );

    for await (const [, page] of booksIterator) {
      await this.refreshBooksHydratedTags(R.pluck('id', page));
    }
  }
}
