# upolujksiazke.pl

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)
![Website](https://img.shields.io/website?url=https%3A%2F%2Fupolujksiazke.pl&style=flat-square)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

OpenSource book reviews aggregator, something like Metacritic / Digg for books. It allows to compare book price between different shops.

## Goals

- [ ] wykop #książki as blog
- [ ] Book summary
- [ ] Changes history
- [ ] Mark as school reading
- [ ] Book summary aggregation
- [ ] Free readings download button
- [ ] Discover all author books (links discover queue, discover all series book, all author book)
- [ ] Add article scrapping (wykop, reddit, etc)
- [ ] Book series tree (al'a tree box)
- [ ] Allegro.pl / Amazon.pl / Skąpiec.pl price synchronization integration
- [ ] Wikipedia style edit info proposals
- [ ] Automatic daily summary tag posting (wykop.pl, #bookmeter tag)
- [ ] Notifications about new reviews
- [ ] Front page customization (pin sections)
- [ ] Read list
- [ ] Category books RSS
- [ ] Allow users to books exchange
- [ ] Price, activity diagram, notifications
- [ ] Category filters
- [ ] Mobile APP
- [ ] Trending books
- [ ] Emoji reactions
- [ ] Add comment after publishing entry on wykop.pl with links to shops, add comment to verify matched book
- [ ] Add current user library link to wykop comment
- [x] Add website spiders (as separate module that appends content to redis)
- [ ] Fb top offers bot post publish
- [ ] product basket, compare multiple books prices in table and summarize per shop basket price
- [ ] RSS integration
- [ ] E-Book readers price section and reviews
- [ ] Section: Top Books/Reviews from Wykop.pl
- [ ] Machine learning for book (review) picking
- [ ] Users who bought this book bought also section
- [ ] Automatic blog posts
- [ ] SEOLinks on blog posts / reviews
- [ ] Tinder alternative but for books
- [ ] Wykop charts in comment
- [ ] Add trending stats
- [ ] Books summaries
- [ ] Dynamic create e-leaflets from books grouped by shop
- [ ] Add button on availability table with "add store link" and if user adds try to parse

## Resources

Similar websites:
https://dribbble.com/shots/4644902-Community-Discussion
https://dribbble.com/shots/9367777-Overindulge-Buy-Books-Product-Page-Exploration-E-commerce
https://www.waterstones.com/book/hamnet/maggie-ofarrell/9781472273468
https://www.barnesandnoble.com/w/shadow-and-bone-leigh-bardugo/1105622727;jsessionid=C67A01F0724C7ED1FB131018117261F6.prodny_store02-atgap14?ean=9781250027436

Icons:
https://boxicons.com/

Color palette:
https://coolors.co/2b2d42-8d99ae-edf2f4-ef233c-d90429

## Available websites

🇵🇱 Poland

- [x] Wykop.pl (#bookmeter tag)
- [x] Gildia.pl
- [x] Literatura Gildia
- [x] Granice.pl
- [x] Matras.pl
- [x] Bonito.pl
- [x] Skupszop.pl
- [x] Dadada.pl
- [x] Aros.pl
- [x] Publio.pl
- [x] Hrosskar.blogspot.com
- [x] Madbooks.pl
- [x] Gandalf.com.pl
- [x] ibuk.pl
- [x] Woblink.com
- [x] Taniaksiazka.pl
- [x] Bryk.pl
- [x] Streszczenia.pl
- [x] klp.pl
- [ ] polskina5.pl
- [ ] Virtualo.pl
- [ ] tantis.pl
- [ ] Znak.com.pl
- [ ] Swiatksiazki.pl
- [ ] wbibliotece.pl
- [ ] Wolnelektury.pl
- [ ] LitRes.pl
- [ ] audible.com
- [ ] Chodnikliteracki.pl
- [ ] czeskieklimaty.pl
- [ ] paskarz.pl
- [ ] litres.pl
- [ ] selkar.pl
- [ ] promocjeksiazkowe.pl (Blog Post)
- [ ] eczytanie-eksiazki.blogspot.com (Blog Post)
- [ ] Tantis.pl
- [ ] Gandalf.com
- [ ] Booklips.pl
- [ ] Allegro.pl
- [ ] Cyfroteka.pl
- [ ] Amazon.com
- [ ] Nieprzeczytane.pl
- [ ] wolnelektury.pl
- [ ] bookbook.pl

🌍 World

- [ ] Reddit
- [ ] Goodreads

## Development

### Setup

```bash
cp .env.example .env # edit .env config
yarn install
yarn run migration:run
yarn run develop
gulp scrapper:refresh
```

### REPL

There is NestJS context present on window, it is called `app`. All entities are exporeted to context.

```bash
yarn console
```

#### REPL Examples

**⚠️ Use services to remove records!** (TypeORM async callbacks are buggy)

Remove book:

```bash
app.select(ScrapperModule).get('BookService').delete([13])
```

Reindex all record of particular type (after index structure change or something):

```bash
app.select(ScrapperModule).get('EsBookIndex').reindexAllEntities();
```

### Tasks

Fetchers:

```bash
# Reindex all records
gulp entity:reindex:all

# Fetches single review by id
gulp scrapper:refresh:single --kind BOOK_REVIEW --remoteId 123 --website wykop.pl

# Fetches single book by url
gulp scrapper:refresh:single --remoteId szepty-spoza-nicosci-remigiusz-mroz,p697692.html --website www.publio.pl

# Fetches all reviews from scrapper
gulp scrapper:refresh:all --kind BOOK_REVIEW --initialPage 1 --website wykop.pl

# Refreshes only first remote reviews page using all scrappers
gulp scrapper:refresh:latest --kind BOOK_REVIEW
gulp scrapper:refresh:latest --kind BOOK_REVIEW --website wykop.pl

# Fetches all reviews pages from websites using all scrappers
gulp scrapper:refresh:all --kind BOOK_REVIEW

# Fetches missing favicons
gulp entity:website:fetch-missing-logos

# Refreshes promotion value in categories
gulp entity:category:refresh-ranking
```

Analyzers:

```bash
# Iterates over all records and reparses them, dangerous!!
# it removes records that are not classified as reviews after analyze
gulp scrapper:reanalyze:all

# Parses again single record
gulp scrapper:reanalyze:single --remoteId szepty-spoza-nicosci-remigiusz-mroz,p697692.html --website www.publio.pl
```

Stats (console):

```
app.select(BookModule).get('BookStatsService').refreshBooksStats(R.pluck('id', books))
```

Spiders:

```bash
 gulp scrapper:spider:run
```

Scrappers:

Refresh all books from all websites:

```bash
 node_modules/.bin/gulp scrapper:refresh:all --kind BOOK_REVIEW --initialPage 1 --website wykop.pl
 node_modules/.bin/gulp scrapper:refresh:all --kind BOOK_REVIEW --website hrosskar.blogspot.com
```

### Importers

#### Flow

  1. Running `scrapper` tasks such as `refreshLatest`, `refreshSingle` triggers fetching new records into `scrapper_metadata` table. All of these functions are stored in `ServiceModule -> ScrapperService`. After successful fetching page of scrapped content `ScrapperService` creates new background job stored in redis that runs database and book matchers.

  2. Each job is later executed and `MetadataDbLoaderService` tries to match book in database and saves it.

#### Scrappers

  Adding new scrapper:

  1. Create scrapper file

  ```bash
    cd ./src/server/modules/importer/sites/
    mkdir example-scrapper/
    touch example-scrapper/ExampleScrapperGroup.ts
  ```

  2. Assign scrapper to `scrappersGroups` variable inside `ScrapperService`


#### Available

Available scrappers:

- [x] wykop.pl
- [x] hrosskar.pl
- [ ] wolnelektury.pl

## Stack

Real World Nest.JS + TypeORM app.

- Node.JS
- Nest.JS
- TypeORM
- React
- nginx
