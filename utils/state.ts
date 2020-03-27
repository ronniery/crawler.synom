import fs from 'fs'
import path from 'path'
import _ from 'lodash'

const exists = (path: string): boolean => fs.existsSync(path)

export class State {

	private path: string = ''
	private internalState: any = {}

	constructor() {
		const statePath = path.join(__dirname, '../')

		if (!exists(statePath)) {
			fs.mkdirSync(statePath);
		}

		this.path = `${statePath}/state.json`
		this.internalState = this.loadState()
	}

	setItem(key: string, value: any): State {
		this.internalState[key] = value
		this.writeState()

		return this
	}

	removeItem(key: string | string[]): State {
		const copy = key instanceof Array ? key : [key]
		copy.forEach(item => delete this.internalState[item])
		this.writeState()

		return this
	}

	getFromState(key: string): any {
		return this.internalState[key]
	}

	private writeState(): void {
		fs.writeFileSync(this.path, JSON.stringify(this.internalState, null, 2))
	}

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
