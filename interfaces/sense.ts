import Synonym from "./synonym";

export default interface Sense {
	
	/**
   * Full description
   */
	description: string;

	/**
	 * List of synonymous to given word
	 */
	synonyms: Synonym[];
}