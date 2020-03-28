<div align="center">
	<img src="https://img.shields.io/badge/cheerio-1.0.0rc.3-darkslateblue?style=for-the-badge" />
	<img src="https://img.shields.io/badge/dotenv-8.2.0-rosybrown?style=for-the-badge" />
	<img src="https://img.shields.io/badge/iconv/lite-0.5.1-darkolivegreen?style=for-the-badge" />
	<img src="https://img.shields.io/badge/lodash-4.17.15-red?style=for-the-badge" />
	<img src="https://img.shields.io/badge/minimist-1.2.5-chartreuse?style=for-the-badge" />
	<img src="https://img.shields.io/badge/mongoose-5.9.6-blue?style=for-the-badge" />
	<img src="https://img.shields.io/badge/request-2.88.2-mediumseagreen?style=for-the-badge" />
	<img src="https://img.shields.io/badge/request/promise-4.2.5-slategray?style=for-the-badge" />
	<img src="https://img.shields.io/badge/typescript-3.8.3-steelblue?style=for-the-badge" />
	<img src="https://img.shields.io/badge/xmlbuilder-15.1.0-mediumblue?style=for-the-badge" />
	<img src="https://img.shields.io/badge/module/alias-2.2.2-violet?style=for-the-badge" />
</div>


<!-- PROJECT LOGO -->
<br />
<p align="center">
  <strong>Crawler.synom</strong><br>
  <small> Only Pt-br words</small>
</p>

<!-- ABOUT THE PROJECT -->
## About The Project

I created the project when my leader needed a bunch of synonym words (on PT-BR) to use it inside our MSSQL database, to enable some text markups to our users, so i handle that problem with that web site www.sinonimo.com.br that contains a lot of synonyms, with that project you will collect all data from the words and their synonym, after that you can generate a thesaurus.xml to import that (if you're on Microsoft ecosystem).

<!-- GETTING STARTED -->
## Getting Started

You will need follow the steps below to run that application.

### Prerequisites

To correct run the project make sure that you have the dependencies installed on your machine.
* npm
* mongodb

You **need** that package to make the crawler run managed and restarted if needed.
```sh
npm/yarn install pm2 -g
```

### Installation

1. Clone the repo
```sh
git clone https://github.com/ronniery/crawler.synom
```
2. Go inside project folder
```sh
cd crawler.synom
```
3. Now open the file `.env` on the root of the project and set the variables `DB_HOST`, `DB_USER` and `DB_PASSWORD`.
4. Install NPM packages
```sh
npm install
```
Or
```sh
yarn install
```
5. Just run on bash
```sh
pm2 start ecosystem.config.js
```

PM2 package will handle the crawler execution for you.

<!-- USAGE EXAMPLES -->
## Flags

There is 2 command line arguments that you can start the application with it:

**--run-crawler** or **--run-crawler=true**: With that flag you're starting the application to run the crawler only.
**--run-xml-builder** or **--run-xml-builder**: With that flag you will start the application to generate Thesaurus xml file.


<!-- LICENSE -->
## License

Distributed under the MIT License
