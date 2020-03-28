require('module-alias/register');
require('dotenv').config();

import mongoose from 'mongoose';
import builder from "xmlbuilder";
import _ from 'lodash';
import fs from "fs";

import { Scope as ScopeModel, DocModel } from '@models/scope';

export class XmlWriter {

	/**
	 * Creates an instance of XmlWriter.
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
	 * @param {string} [xmlPath=process.env.XML_DESTINATION_PATH!] Default path to write the generated xml
	 * @returns {Promise<void>} Tells when the generation process finish
	 * @memberof XmlWriter
	 */
	public async generate(xmlPath: string = process.env.XML_DESTINATION_PATH!): Promise<void> {
		const xml = builder.create('root');

		(
			await ScopeModel
				.find({})
		)
			.forEach((scope: DocModel) => {
				//Generate the xml with the configuration below
				console.log(`Added to xml the string: [${scope.word}]`);

				const child = this.getXmlChild(scope);

				if (child.sub.length !== 0) {
					xml
						.ele('expansion')
						.com(`string: ${scope.word}`)
						.ele(child);
				}
			})

		fs.writeFileSync(xmlPath,
			xml.end({
				pretty: true
			}),
			"utf8"
		);
	}

	/**
	 * Get the xml node child that will compose the final thesaurus xml
	 *
	 * @private
	 * @param {DocModel} model The mongo object that holds the synonym
	 * @returns {*} Child object with thesaurus markup
	 * @memberof XmlWriter
	 */
	private getXmlChild(model: DocModel): any {
		const data: any = {
			sub: [{
				'#text': model.word
			}]
		};

		model
			.senses
			.flatMap(({ synonyms }) =>
				synonyms
					.map(synonym => synonym.word)
			)
			.forEach(syn => {
				data.sub.push({
					'#text': syn
				})
			})

		return data
	}
}