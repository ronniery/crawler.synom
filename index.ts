require('module-alias/register');
require('dotenv').config();

import _ from 'lodash';
import mongoose from 'mongoose';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import request from 'request-promise';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2))
const isArgSet = (argname: string) => [true, "true"].includes(argv[argname])

import { XmlWriter } from '@utils/xmlwriter';
import { State } from '@utils/state';
import { Scope as ScopeModel } from '@models/scope';
import Scope from '@interfaces/scope';
import Synonym from '@interfaces/synonym';

/**
 * The main entry of the core application
 *
 * @export
 * @class Index
 */
export class Index {

	/**
	 * Main target base url
	 *
	 * @private
	 * @type {string}
	 * @memberof Index
	 */
	private readonly baseUrl?: string = process.env.BASE_URL;

	/**
	 * The state that will holds the next link iteration
	 *
	 * @private
	 * @type {State}
	 * @memberof Index
	 */
	private readonly state: State;

	/**
	 *Creates an instance of Index.
	 * @memberof Index
	 */
	constructor() {
		this.state = new State()

		mongoose.connect(process.env.DB_HOST!, {
			user: process.env.DB_USER,
			pass: process.env.DB_PASSWORD,
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
	}

	/**
	 * The entry start point of this application, that will run recursivelly to get ALL
	 * words from the target.
	 *
	 * @returns {(Promise<void | {}>)} Resolve promise as the application finishing
	 * @memberof Index
	 */
	public async run(): Promise<void | {}> {
		const scrapAllPages = async (moreLinks = []) => {
			// The current last word from the website is 'zurzir'
			await this.getPages(moreLinks)
				.then(async ({ pages, nextLinks }) => {
					for (const page of pages) {
						await this.extractScope(page)
					}

					if (_.some(nextLinks)) {
						return await scrapAllPages(nextLinks)
					}

					return
				})
		}

		try {
			if (isArgSet('run-crawler')) {
				await scrapAllPages()
			}

			if (isArgSet('run-xml-builder')) {
				await new XmlWriter()
					.generate();
			}
		} catch (e) {
			return e
		}
	}

	/**
	 * Get html pages for the given paths
	 *
	 * @private
	 * @param {string[]} [paths=[]] Paths that points to a word on `https://www.sinonimos.com.br/` web site
	 * @returns {Promise<any>} An object with crawled pages and the next collection of paths to be crawled
	 * @memberof Index
	 */
	private async getPages(paths: string[] = []): Promise<any> {
		const { state } = this
		let urlPaths: string[] = ['10/']
		let stateUrl: string[] = paths

		if (_.isEmpty(paths)) {
			stateUrl = state.getFromState('nextPaths') || ''

			if (_.isEmpty(stateUrl)) {
				stateUrl = urlPaths
			}
		}

		const promises = stateUrl.map(async (path: string) =>
			this.doRequest(`${this.baseUrl}/${path}/`)
		)

		return Promise.all(promises)
			.then((responses: CheerioStatic[]) => {
				const $last = _.last(responses)!

				return {
					pages: responses,
					nextLinks: this.getNexPaths($last)
				}
			})
	}

	/**
	 * Do request, to given url.
	 *
	 * @private
	 * @param {string} url Url to be requested
	 * @returns {Promise<CheerioStatic>} A promise with `pending` status, that will be fullfiled when request reaches the url 
	 * @memberof Index
	 */
	private async doRequest(url: string): Promise<CheerioStatic> {
		const { ENCODING } = process.env

		console.log(`Fetching page from url [${url}]`)

		return request(url, {
			method: 'GET',
			encoding: null,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
				'Origin': this.baseUrl,
				'Referer': this.baseUrl,
				'Content-Type': `text/html; charset=${ENCODING}`
			},
			timeout: 5000,
			transform: (html: string) => {
				const decodedString = iconv.decode(Buffer.from(html), ENCODING!);
				return cheerio.load(decodedString);
			}
		})
			.catch(err => {
				return err
			})
	}

	/**
	 * Extract the word and his given senses from crawled page
	 *
	 * @private
	 * @param {CheerioStatic} $ Dom node representation for the html inside the given link
	 * @returns {Promise<Scope>} A scope full with synonymous for found word
	 * @memberof Index
	 */
	private async extractScope($: CheerioStatic): Promise<Scope> {
		const scope: Scope = {
			wordUrl: $('link[rel="canonical"]').attr('href')!,
			word: _.last($('.h-palavra').text().match(/Sinônimo\sde\s(.*)/))!,
			senses: []
		};

		$('#content .s-wrapper').each((_idx: number, el: CheerioElement) =>
			scope.senses.push({
				description: $(el).find('.sentido').text().replace(':', ''),
				synonyms: $(el).find('a').toArray().map<Synonym>((a) => {
					return {
						word: $(a).text(),
						url: `${this.baseUrl}${$(a).attr('href')!}`
					}
				})
			})
		);

		await ScopeModel.find({ wordUrl: scope.wordUrl })
			.then(async (found) => {
				if (_.isEmpty(found)) {
					await new ScopeModel(scope)
						.save()
				}
			})

		return scope;
	}

	/**
	 * Get the next list of links to be crawled
	 *
	 * @private
	 * @param {CheerioStatic} $ Dom node from html page previously crawled
	 * @returns {string[]} The next paths to continue crawling the page
	 * @memberof Index
	 */
	private getNexPaths($: CheerioStatic): string[] {
		const nextPaths = $("ul.lig-next a")
			.toArray()
			.map((a: CheerioElement) =>
				$(a).attr("href")!.replace(/\//g, '')
			);

		this.state.setItem('nextPaths', nextPaths)
		return nextPaths
	}
}

(async () => {
	try {
		await new Index()
			.run()
	} catch (e) {
		console.log(e.stack)
	} finally {
		process.exit(0)
	}
})()

