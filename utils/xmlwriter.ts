require('dotenv').config();

import mongoose from 'mongoose';
import _ from 'lodash';
import builder from "xmlbuilder";
import fs from "fs";

import { Scope as ScopeModel } from '../models/scope';
import Scope from '../interfaces/scope';

export class XmlWriter {

	/**
	 * Query to get all words on db (words without spaces)
	 *
	 * @private
	 * @type {Object}
	 * @memberOf XmlWriter
	 */
	private queryWords: Object = { 'word': { $regex: /\s/ } };

	/**
	 * Query to get all terms on db (large phrases with spaces between words)
	 * 
	 * @private
	 * @type {Object}
	 * @memberOf XmlWriter
	 */
	private queryTerms: Object = { 'word': { $not: /\s/ } };

	/**
	 * Creates an instance of XmlWriter.
	 * @param {WriterOptions} [options=new WriterOptions()] Configurable options to generate the xml
	 * 
	 * @memberOf XmlWriter
	 */
	constructor() {
		mongoose.connect(process.env.DB_HOST!, {
			user: process.env.DB_USER,
			pass: process.env.DB_PASSWORD,
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
	}

	/**
	 * Core proccess of this class generate the xml for thesaurus using
	 * the given configuration on the constructor
	 * 
	 * @param {string} [xmlPath="./thesaurus.xml"] Default path to write the generated xml
	 * 
	 * @memberOf XmlWriter
	 */
	public async generate(xmlPath: string = "./thesaurus.xml"): Promise<void> {
		const xml = builder.create('root');

		(
			await ScopeModel
				.find({})
		)
			.forEach((scope: Scope) => {
				//Generate the xml with the configuration below
				console.log('Added to xml the string: [' + scope.word + ']');

				const synons = scope
					.senses
					.map(({ synonyms }) =>
						synonyms
							.map(synonym => synonym.word)
					)

				const data = {
					sub: [{
						'#text': scope.word
					}]
				};

				for (const synon of _.flatten(synons)) {

				}

			})

		//Get all workable objects
		self.getWorkObjects<Scope>().then((scopes: Scope[]) => {
			//To all found objects...
			scopes.forEach((scope: Scope) => {
				//Generate the xml with the configuration below
				console.log('Added to xml the string: [' + scope.word + ']');

				if (self.untilWhichLevel === WriterOptions.MAX) {
					localMaxLevel = scope.senses.length;
				}

				var data = { 'sub': [{ '#text': scope.word }] };
				for (var i = 0; i < localMaxLevel; i++) {
					((scope.senses[i] || new Sense()).synomn || []).forEach((syn: string) => {
						if (self.skipSpacedWords) {
							if (!self.hasWhiteSpace(syn)) {
								data.sub.push({
									'#text': syn
								})
							}
						} else {
							data.sub.push({
								'#text': syn
							})
						}
					});
				}

				if (data.sub.length !== 0) {
					xml.ele('expansion').com('string: ' + scope.word).ele(data);
				}
			});

			fs.writeFileSync(xmlPath,
				xml.end({
					pretty: true
				}),
				"utf8"
			);
		});
	}

	/**
	 * Get all possible workable objects or in simple words, using the given
	 * configuration as {@link WriterOptions}, this method will query the bd
	 * to retrieve the terms or only words if the given options set it
	 * 
	 * @private
	 * @returns {Promise<Scope[]>} Given promisse with all queried objects
	 * 
	 * @memberOf XmlWriter
	 */
	private getWorkObjects<Scope>(): Promise<Scope[]> {
		const self = this;

		return new Promise<Scope[]>(resolve => {
			let scopes = [];

			//Should i get all terms?
			if (self.useTerms) {
				self.db.find(self.queryTerms).then((termScopes: any[]) => {
					scopes = termScopes;

					if (!self.useWords) {
						resolve(scopes);
					}
				});
			}

			//And words i should get all too?
			if (self.useWords) {
				self.db.find(self.queryWords).then((wordScopes: any[]) => {
					scopes = scopes.concat(wordScopes);
					resolve(scopes);
				});
			}
		});
	}

	/**
	 * Tells if a given string has spaces
	 * 
	 * @private
	 * @param {string} str The target string to be checked
	 * @returns {boolean} Indication of space
	 * 
	 * @memberOf XmlWriter
	 */
	private hasWhiteSpace(str: string): boolean {
		return /\s/g.test(str);
	}
}

/**
 * Configuration class to {@link XmlWriter} 
 * 
 * @export
 * @class WriterOptions
 */
export class WriterOptions {

	/**
	 * A number one
	 * (this is used to determine which level of deep senses will be used to xmlwriter)
	 * 
	 * @static
	 * @type {number}
	 * @memberOf WriterOptions
	 */
	public static readonly FIRST: number = 1;

	/**
	 *  A maximum level of senses
	 * (this is used to determine which level of deep senses will be used to xmlwriter)
	 * 
	 * @static
	 * @type {number}
	 * @memberOf WriterOptions
	 */
	public static readonly MAX: number = 99;

	/**
	 * Creates an instance of WriterOptions.
	 *
	 * @param {boolean} [useTerms=false] Set if the {@link XmlWriter} should use terms to generate
	 *  the xml like 'concedido a termo de venda' (A term is a word like phrase)
	 * @param {boolean} [useWords=true] Set if the generator will use words (A word is a group of chars without spaces)
	 * @param {boolean} [skipSpacedWords=true] Set if the {@link XmlWriter} should ignore spaced
	 *  words like 'por a prazo'
	 * @param {number} [untilWhichLevel=1] Determines which level the app will use of {@link Scope.senses} to renderize
	 */
	constructor(
		public useTerms: boolean = false,
		public useWords: boolean = true,
		public skipSpacedWords: boolean = true,
		public untilWhichLevel: number = WriterOptions.FIRST
	) { }
}