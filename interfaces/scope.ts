import Sense from "./sense";

export default interface Scope {

	/**
	 * Full word url
	 *
	 * @type {string}
	 * @memberof Scope
	 */
	wordUrl: string;

	/** 
	 * Word with his senses
	 */
	word: string;

	/**
	 * Full senses provided by `https://www.sinonimos.com.br/` web site
	 */
	senses: Sense[];
}