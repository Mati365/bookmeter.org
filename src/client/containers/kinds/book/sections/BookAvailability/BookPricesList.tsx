import React, {useMemo} from 'react';
import c from 'classnames';

import {useI18n} from '@client/i18n';

import {BookFullInfoRecord} from '@api/types';
import {Table} from '@client/components/ui';
import {BookPricesReleaseRow} from './BookPricesReleaseRow';

import {sortReleasesByPrice} from './helpers';

type BookPricesListProps = {
  book: BookFullInfoRecord,
  className?: string,
};

export const BookPricesList = ({className, book}: BookPricesListProps) => {
  const t = useI18n('book.availability');
  const sortedReleases = useMemo(
    () => sortReleasesByPrice(book.releases),
    [book],
  );

  return (
    <Table
      className={c(
        'c-book-prices',
        className,
      )}
      layout='fixed'
    >
      <thead>
        <tr>
          <th style={{width: 110}}>{t('type')}</th>
          <th style={{width: 160}}>{t('isbn')}</th>
          <th>{t('release')}</th>
        </tr>
      </thead>
      <tbody>
        {sortedReleases.map(
          (release) => (
            <BookPricesReleaseRow
              key={release.id}
              release={release}
            />
          ),
        )}
      </tbody>
    </Table>
  );
};

BookPricesList.displayName = 'BookPricesList';
