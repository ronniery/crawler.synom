import fs from 'fs';
import path from 'path';
import _ from 'lodash';

/**
 * Check if the given path exits
 * 
 * @param path Path to be checked
 */
const exists = (path: string): boolean => fs.existsSync(path)

export class State {

	/**
	 * Holds the entire path to store/write the state file
	 *
	 * @private
	 * @type {string}
	 * @memberof State
	 */
	private path: string = ''

	/**
	 * Internal state to store all application values
	 *
	 * @private
	 * @type {*}
	 * @memberof State
	 */
	private internalState: any = {}

	/**
	 * Creates an instance of State.
	 * @memberof State
	 */
	constructor() {
		const statePath = path.join(__dirname, '../')

		if (!exists(statePath)) {
			fs.mkdirSync(statePath);
		}

		this.path = `${statePath}/state.json`
		this.internalState = this.loadState()
	}

	/**
	 * Set a item on state
	 *
	 * @param {string} key The item name
	 * @param {*} value The current value
	 * @returns {State} A self reference to chain methods
	 * @memberof State
	 */
	setItem(key: string, value: any): State {
		this.internalState[key] = value
		this.writeState()

		return this
	}

	/**
	 * Remove item from state
	 *
	 * @param {(string | string[])} key The item or items (Array string like) to be removed
	 * @returns {State} A self reference to chain methods
	 * @memberof State
	 */
	removeItem(key: string | string[]): State {
		const copy = key instanceof Array ? key : [key]
		copy.forEach(item => delete this.internalState[item])
		this.writeState()

		return this
	}

	/**
	 * Get a value from state
	 *
	 * @param {string} key The key name from the item inside state
	 * @returns {(any | undefined)} The value from the item
	 * @memberof State
	 */
	getFromState(key: string): any | undefined {
		return this.internalState[key]
	}

	/**
	 * A state writer to persist all changes on internal state
	 *
	 * @private
	 * @memberof State
	 */
	private writeState(): void {
		fs.writeFileSync(this.path, JSON.stringify(this.internalState, null, 2))
	}

	/**
	 * Loads the state with previous state file values
	 *
	 * @private
	 * @returns {*} An empty state if the previous state not exists
	 * @memberof State
	 */
	private loadState(): any {
		if (fs.existsSync(this.path)) {
			const content = fs
				.readFileSync(this.path)
				.toString()

			return Object.assign({}, _.isEmpty(content) ? {} : JSON.parse(content))
		}

		return {}
	}
}
