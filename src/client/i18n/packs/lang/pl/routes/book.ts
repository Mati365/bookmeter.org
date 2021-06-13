/* eslint-disable max-len */
import {PL_SHARED_SEO_META} from '../shared';

export const PL_BOOK_ROUTE_PACK = {
  seo: {
    title: '%{emoji} %{title} - %{authors} | Porównaj ceny książek, oceny i recenzje  - upolujksiazke.pl',
  },

  reviews: {
    seo: {
      ...PL_SHARED_SEO_META,
      title: '💬 Opinie o książce %{title} - %{authors} | Porównaj ceny książek, oceny i recenzje  - upolujksiazke.pl',
    },
  },
};
