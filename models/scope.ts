import { Schema, Document, Model, model } from 'mongoose';
import Scope from "../interfaces/scope";

export interface DocModel extends Scope, Document { }

const schema = new Schema({
	word: { type: String, index: true },
	wordUrl: { type: String },
	senses: [{
		description: { type: String },
		synom: [String]
	}]
}, {
	collection: 'scopes'
})

export const Scope: Model<DocModel> = model<DocModel>('Scope', schema);