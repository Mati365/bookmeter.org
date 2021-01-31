import {
  normalizeISBN,
  normalizeURL,
  normalizeParsedTitle,
  normalizeParsedText,
} from '@server/common/helpers';

import {Language} from '@server/constants/language';
import {ScrapperMetadataKind} from '@server/modules/importer/modules/scrapper/entity';

import {CreateBookAuthorDto} from '@server/modules/book/modules/author/dto/CreateBookAuthor.dto';
import {CreateBookDto} from '@server/modules/book/dto/CreateBook.dto';
import {CreateBookReleaseDto} from '@server/modules/book/modules/release/dto/CreateBookRelease.dto';
import {CreateBookPublisherDto} from '@server/modules/book/modules/publisher/dto/BookPublisher.dto';
import {CreateImageAttachmentDto} from '@server/modules/attachment/dto';
import {CreateBookAvailabilityDto} from '@server/modules/book/modules/availability/dto/CreateBookAvailability.dto';

import {AsyncURLParseResult} from '@server/common/helpers/fetchAsyncHTML';
import {WebsiteScrapperParser} from '../../../modules/scrapper/service/shared';
import {
  BINDING_TRANSLATION_MAPPINGS,
  BookAvailabilityParser,
} from '../../../modules/scrapper/service/scrappers/Book.scrapper';

import {LiteraturaGildiaBookAuthorMatcher} from '../matchers/LiteraturaGildiaBookAuthor.matcher';
import {LiteraturaGildiaBookPublisherMatcher} from '../matchers/LiteraturaGildiaBookPublisher.matcher';

export class LiteraturaGildiaBookParser
  extends WebsiteScrapperParser<CreateBookDto>
  implements BookAvailabilityParser<AsyncURLParseResult> {
  /**
   * @inheritdoc
   */
  parseAvailability({url}: AsyncURLParseResult) {
    return Promise.resolve(
      {
        result: [
          new CreateBookAvailabilityDto(
            {
              showOnlyAsQuote: false,
              remoteId: url.split('/').slice(-2).join('/'),
              url,
            },
          ),
        ],
      },
    );
  }

  /**
   * @inheritdoc
   */
  async parse(bookPage: AsyncURLParseResult) {
    if (!bookPage)
      return null;

    const {$} = bookPage;
    const $wideText = $('#yui-main .content .widetext');
    const text = $wideText.text();

    const [author, release] = await Promise.all(
      [
        this.extractAuthor($wideText),
        this.extractRelease(bookPage),
      ],
    );

    return new CreateBookDto(
      {
        defaultTitle: release.title,
        originalPublishDate: normalizeParsedText(text.match(/Rok wydania oryginału: ([\S]+)/)?.[1]),
        authors: [
          author,
        ],
        releases: [
          release,
        ],
      },
    );
  }

  /**
   * Extracts info about release from book page
   *
   * @param {AsyncURLParseResult} bookPage
   * @returns
   * @memberof LiteraturaGildiaBookParser
   */
  private async extractRelease(bookPage: AsyncURLParseResult) {
    const {$} = bookPage;
    const $wideText = $('#yui-main .content .widetext');

    const publisher = await this.extractPublisher($wideText);
    const text = $wideText.text();
    const $coverImage = $wideText.find('img.main-article-image');

    return new CreateBookReleaseDto(
      {
        publisher,
        lang: Language.PL,
        title: normalizeParsedTitle($('h1').text()),
        description: normalizeParsedText($wideText.find('div > p').text()),
        edition: normalizeParsedText(text.match(/Wydanie: ([\S]+)/)?.[1]),
        isbn: normalizeISBN(text.match(/ISBN: ([\w-]+)/)?.[1]),
        totalPages: (+text.match(/Liczba stron: (\d+)/)?.[1]) || null,
        availability: (await this.parseAvailability(bookPage)).result,
        format: normalizeParsedText(text.match(/Format: ([\S]+)/)?.[1]),
        binding: BINDING_TRANSLATION_MAPPINGS[
          normalizeParsedText(text.match(/Oprawa: ([\S]+)/)?.[1])?.toLowerCase()
        ],
        cover: $coverImage && new CreateImageAttachmentDto(
          {
            originalUrl: normalizeURL($coverImage.attr('src')),
          },
        ),
      },
    );
  }

  /**
   * Extracts single author
   *
   * @private
   * @param {cheerio.Cheerio} $parent
   * @returns
   * @memberof LiteraturaGildiaBookParser
   */
  private async extractAuthor($parent: cheerio.Cheerio) {
    const authorMatcher = <LiteraturaGildiaBookAuthorMatcher> this.matchers[ScrapperMetadataKind.BOOK_AUTHOR];
    const $authorAnchor = $parent.find('> a[href^="/tworcy/"]').first();

    return (await authorMatcher.searchRemoteRecord(
      {
        data: new CreateBookAuthorDto(
          {
            name: normalizeParsedText($authorAnchor.text()),
          },
        ),
      },
      {
        path: $authorAnchor.attr('href'),
      },
    )).result;
  }

  /**
   * Fetches publisher name from text
   *
   * @private
   * @param {cheerio.Cheerio} $parent
   * @returns
   * @memberof LiteraturaGildiaBookMatcher
   */
  private async extractPublisher($parent: cheerio.Cheerio) {
    const publisherMatcher = <LiteraturaGildiaBookPublisherMatcher> this.matchers[ScrapperMetadataKind.BOOK_PUBLISHER];
    const $publisherAnchor = $parent.find('a[href^="/wydawnictwa/"]');

    return (await publisherMatcher.searchRemoteRecord(
      {
        data: new CreateBookPublisherDto(
          {
            name: normalizeParsedText($publisherAnchor.text()),
          },
        ),
      },
      {
        path: $publisherAnchor.attr('href'),
      },
    )).result;
  }
}
