import {ScrapperMetadataKind} from '@scrapper/entity';
import {
  BookShopScrappersGroup,
  BookShopScrappersGroupConfig,
} from '@scrapper/service/scrappers/BookShopScrappersGroup';

import {DadadaBookMatcher} from './DadadaBook.matcher';
import {DadadaBookParser} from './DadadaBook.parser';

export class DadadaScrappersGroup extends BookShopScrappersGroup {
  constructor(options: BookShopScrappersGroupConfig) {
    super(
      {
        ...options,
        matchers: {
          [ScrapperMetadataKind.BOOK]: new DadadaBookMatcher(options),
        },
        parsers: {
          [ScrapperMetadataKind.BOOK]: new DadadaBookParser(options),
        },
      },
    );
  }
}
