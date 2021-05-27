import React from 'react';
import {Redirect} from 'react-router';
import * as R from 'ramda';

import {
  capitalize,
  objPropsToPromise,
} from '@shared/helpers';

import {
  formatBookTitle,
  formatBookVolume,
} from '@client/helpers/logic';

import {useUA} from '@client/modules/ua';
import {useI18n} from '@client/i18n';

import {AsyncRoute} from '@client/components/utils/asyncRouteUtils';
import {Breadcrumbs} from '@client/containers/Breadcrumbs';
import {BooksAuthorsGroupedBooks} from '@api/repo';
import {
  BookFullInfoRecord,
  CategoryBooksGroup,
} from '@api/types';

import {BookReviewsSection} from '@client/containers/kinds/book/sections/BookReviews';
import {
  BookAvailabilitySection,
  BookInfo,
  BookSummariesSection,
  CategoriesGroupsBooksSection,
} from '@client/containers/kinds/book';

import {Container} from '@client/components/ui';
import {Layout, LayoutViewData} from '@client/containers/layout';

import {
  BookLink,
  BooksLink,
  BookCategoryLink,
  BOOK_PATH,
  HOME_PATH,
} from '../Links';

import {useTrackBookRoute} from './hooks/useTrackBookRoute';

type BookRouteViewData = {
  layoutData: LayoutViewData,
  book: BookFullInfoRecord,
  authorsBooks: BooksAuthorsGroupedBooks,
  popularCategoriesBooks: CategoryBooksGroup[],
};

export const BookRoute: AsyncRoute<BookRouteViewData> = (
  {
    book,
    authorsBooks,
    layoutData,
    popularCategoriesBooks,
  },
) => {
  const t = useI18n();
  const ua = useUA();

  useTrackBookRoute(
    {
      recordId: book?.id,
    },
  );

  if (!book)
    return <Redirect to={HOME_PATH} />;

  const {
    volume, defaultTitle,
    hierarchy, primaryCategory,
  } = book;

  return (
    <Layout {...layoutData}>
      <Container className='c-book-route'>
        <Breadcrumbs
          items={[
            {
              id: 'books',
              node: (
                <BooksLink>
                  {t('shared.breadcrumbs.books')}
                </BooksLink>
              ),
            },
            primaryCategory && {
              id: 'category',
              node: (
                <BookCategoryLink item={primaryCategory}>
                  {capitalize(primaryCategory.name)}
                </BookCategoryLink>
              ),
            },
            ...(
              volume?.name !== '1' && hierarchy?.length
                ? [
                  {
                    id: 'book',
                    node: (
                      <BookLink item={hierarchy[0]}>
                        {defaultTitle}
                      </BookLink>
                    ),
                  },
                  {
                    id: 'volume',
                    node: formatBookVolume(
                      {
                        t,
                        volume,
                      },
                    ),
                  },
                ]
                : [
                  {
                    id: 'book',
                    node: formatBookTitle(
                      {
                        t,
                        book,
                      },
                    ),
                  },
                ]
            ),
          ].filter(Boolean)}
        />

        <BookInfo
          book={book}
          authorsBooks={authorsBooks}
        >
          <BookAvailabilitySection
            book={book}
            shrink={ua.mobile}
          />
          <BookReviewsSection book={book} />
          <BookSummariesSection book={book} />
        </BookInfo>

        {popularCategoriesBooks?.length > 0 && (
          <CategoriesGroupsBooksSection items={popularCategoriesBooks} />
        )}
      </Container>
    </Layout>
  );
};

BookRoute.displayName = 'BookRoute';

BookRoute.route = {
  path: BOOK_PATH,
};

/**
 * See RedisCacheWarmup when you edit any cached
 * query, prefer using default values
 */
BookRoute.getInitialProps = async (attrs) => {
  const {api: {repo}, match} = attrs;
  const {layoutData, book} = await objPropsToPromise(
    {
      layoutData: Layout.getInitialProps(attrs),
      book: repo.books.findOne(match.params.id),
    },
  );

  if (!book)
    return {};

  const categoriesIds = R.pluck('id', book.categories || []);
  const excludeBooksIds = R.pluck(
    'id',
    book.hierarchy?.length
      ? book.hierarchy
      : [book],
  );

  const {
    authorsBooks,
    popularCategoriesBooks,
  } = await objPropsToPromise(
    {
      popularCategoriesBooks: repo.recentBooks.findCategoriesPopularBooks(
        {
          categoriesIds: R.take(5, categoriesIds),
          excludeBooksIds,
          limit: 2,
          itemsPerGroup: 7,
        },
      ),
      authorsBooks: repo.books.findGroupedAuthorsBooks(
        {
          excludeIds: [book.id],
          limit: 4,
          authorsIds: R.pluck('id', book.authors),
        },
      ),
    },
  );

  return {
    authorsBooks,
    popularCategoriesBooks,
    book,
    layoutData,
  } as BookRouteViewData;
};
