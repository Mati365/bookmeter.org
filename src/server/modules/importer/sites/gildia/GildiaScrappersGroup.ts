import {ScrapperMetadataKind} from '@scrapper/entity';
import {
  BookShopScrappersGroup,
  BookShopScrappersGroupConfig,
} from '@scrapper/service/scrappers/BookShopScrappersGroup';

import {GildiaBookMatcher} from './GildiaBook.matcher';
import {GildiaBookParser} from './GildiaBook.parser';

export class GildiaScrappersGroup extends BookShopScrappersGroup {
  constructor(options: BookShopScrappersGroupConfig) {
    super(
      {
        ...options,
        matchers: {
          [ScrapperMetadataKind.BOOK]: new GildiaBookMatcher(options),
        },
        parsers: {
          [ScrapperMetadataKind.BOOK]: new GildiaBookParser(options),
        },
      },
    );
  }
}
