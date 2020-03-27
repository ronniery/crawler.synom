require('dotenv');
require('module-alias/register');

import _ from 'lodash';
import mongoose from 'mongoose';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import request, { RequestPromise } from 'request-promise';

import { XmlWriter } from './utils/xmlwriter';
import { State } from './utils/state';
import { Scope as ScopeModel } from './models/scope';
import Scope from './interfaces/scope';

export class Index {

	/**
	 * Main base url
	 */
	private readonly baseUrl?: string = process.env.BASE_URL;

	private readonly state: State;

	/**
	 * Constructs an instance of this class
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
	 * Run the app doing the first request to get the next continuous list of links
	 * to crawl the entire list of words available inside the sinonimos server.
	 * 
	 * @param nextUrl Next url to run a recursive call
	 * @param firstRun Tells if is this a first run of this app
	 */
	public async run(crawler: boolean, xmlBuilder: boolean): Promise<void | {}> {
		const scrapAllPages = async () => {
			const { pages, nextLinks } = await this.getPages()

			for (const page of pages) {
				await this.extractScope(page)
			}

			if (_.some(nextLinks)) {
				return this.getPages(nextLinks)
			}
		}

		try {
			if (crawler) {
				await scrapAllPages()
			}
		} catch (e) {
			console.error(e)
		}

		if (xmlBuilder) {
			new XmlWriter().generate();
		}
	}

	private async getPages(paths: string[] = []): Promise<any> {
		const { state } = this
		let copy = ['10/']

		if (_.isEmpty(paths)) {
			const stateUrl = state.getFromState('currentUrl')

			if (!_.isEmpty(stateUrl)) {
				copy = stateUrl
			}
		}

		return Promise.all(
			paths.map(async (path: string) => {
				const fullUrl = `${this.baseUrl}/${path}`
				return this.doRequest(fullUrl)
			})
		).then((responses: CheerioStatic[]) => {
			const $last = _.last(responses)!

			return {
				pages: responses,
				nextLinks: this.getNextLinks($last)
			}
		})
	}

	/**
	 * Do request, to given url.
	 * 
	 * @param url Url to be requested
	 * @returns A promise with `pending` status, that will be fullfiled when request reaches the url 
	 */
	private doRequest(url: string): RequestPromise<CheerioStatic> {
		const { ENCODING } = process.env

		return request(url, {
			method: "GET",
			encoding: null,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
				"Origin": this.baseUrl,
				"Referer": this.baseUrl,
				"Content-Type": `text/html; charset=${ENCODING}`
			},
			timeout: 5000,
			transform: (html: string) => {
				const decodedString = iconv.decode(Buffer.from(html), ENCODING!);
				return cheerio.load(decodedString);
			}
		})
	}

	/**
	 * Extract the word and his given senses from crawled page
	 * 
	 * @param $ Dom node representation for the html inside the given link
	 * @returns A scope full with synonymous for found word
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
				synomn: $(el).find('.sinonimos a, span').toArray().map(el => $(el).text())
			})
		);

		await new ScopeModel(scope)
			.save()

		return scope;
	}

	/**
	 * Get the next list of links to be crawled
	 * 
	 * @param $ Dom node from html page previously crawled
	 */
	private getNextLinks($: CheerioStatic): string[] {
		const nextLinks = $("ul.lig-next a")
			.toArray()
			.map((a: CheerioElement) =>
				`${this.baseUrl}/${$(a).attr("href")!.replace(/\//g, '')}`
			);

		this.state.setItem('currentUrl', nextLinks)
		return nextLinks
	}
}

(async () => {
	await new Index()
		.run(true, false);
})
