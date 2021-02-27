import * as R from 'ramda';
import stringSimilarity from 'string-similarity';

import {safeArray} from '@shared/helpers';
import {CanBeArray} from '@shared/types';

import {normalizeParsedText} from '@server/common/helpers';
import {normalizeBookTitle, NormalizedBookTitleInfo} from './normalizeBookTitle';

type BookSimilarityFields = {
  title: string,
  volume?: string,
  author?: CanBeArray<string>,
};

export const orderAuthorField = (author: string) => {
  if (!author)
    return null;

  const normalized = normalizeParsedText(author);
  if (!normalized)
    return null;

  return R.sortBy(
    R.identity,
    normalized.toLowerCase().split(' '),
  ).join(' ');
};

/**
 * Calculate similarity between books based on titles
 *
 * @export
 * @param {Pick<NormalizedBookTitleInfo, 'title'|'volume'>} a
 * @param {Pick<NormalizedBookTitleInfo, 'title'|'volume'>} b
 * @returns
 */
export function getNormalizedBooksSimilarity(
  a: Pick<NormalizedBookTitleInfo, 'title'|'volume'>,
  b: Pick<NormalizedBookTitleInfo, 'title'|'volume'>,
) {
  let similarity = (
    stringSimilarity.compareTwoStrings(a.title || '', b.title || '')
  );

  if (similarity > 0.5 && a.volume === b.volume)
    similarity *= 1.15;

  return similarity;
}

/**
 * Compares authors strings
 *
 * @export
 * @param {CanBeArray<string>} a
 * @param {CanBeArray<string>} b
 * @returns
 */
export function fuzzyAuthorsSimilarity(a: CanBeArray<string>, b: CanBeArray<string>) {
  let authorSimilarity = 0;

  const aAuthors = safeArray(a).map((title) => orderAuthorField(title).toLowerCase());
  const bAuthors = safeArray(b).map((title) => orderAuthorField((title).toLowerCase()));

  for (const sourceAuthor of aAuthors) {
    for (const rowAuthor of bAuthors) {
      authorSimilarity = Math.max(
        authorSimilarity,
        stringSimilarity.compareTwoStrings(sourceAuthor || '', rowAuthor || ''),
      );
    }
  }

  return authorSimilarity;
}

/**
 * Matches similar anchor
 *
 * @export
 * @param {Object} attrs
 * @returns
 */
export function fuzzyFindBookAnchor(
  {
    $,
    book: {
      title,
      author,
    },
    anchorSelector,
  }: {
    $: cheerio.Cheerio,
    book: BookSimilarityFields,
    anchorSelector(anchor: cheerio.Element): BookSimilarityFields,
  },
) {
  const source = normalizeBookTitle(title.toLowerCase());
  const lowerAuthors = <string[]> safeArray(author || []).map(orderAuthorField);

  const item = R.head(
    R.sort(
      (a, b) => b[0] - a[0],
      $
        .toArray()
        .map((el): [number, cheerio.Element] => {
          const selectorValue = anchorSelector(el);
          if (!selectorValue)
            return null;

          const selected = {
            ...normalizeBookTitle(selectorValue.title?.toLowerCase()),
            author: safeArray(selectorValue.author || []).map(orderAuthorField),
          };

          let authorSimilarity = author ? 0 : 1;

          if (selected.author) {
            authorSimilarity = 0;

            for (const sourceAuthor of lowerAuthors) {
              for (const rowAuthor of selected.author) {
                authorSimilarity = Math.max(
                  authorSimilarity,
                  stringSimilarity.compareTwoStrings(sourceAuthor || '', rowAuthor || ''),
                );
              }
            }
          }

          const similarity = (
            getNormalizedBooksSimilarity(source, selected) * authorSimilarity
          );

          return (
            similarity < 0.6
              ? null
              : [similarity, el]
          );
        })
        .filter(Boolean),
    ),
  );

  return item?.[1];
}
