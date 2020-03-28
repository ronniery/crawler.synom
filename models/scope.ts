import { Schema, Document, Model, model } from 'mongoose';
import Scope from "@interfaces/scope";

export interface DocModel extends Scope, Document { }

const schema = new Schema({
	word: { type: String },
	wordUrl: { type: String, index: true },
	senses: [{
		description: { type: String },
		synonyms: [{
			word: { type: String },
			url: { type: String }
		}]
	}]
}, {
	collection: 'scopes',
	timestamps: true
})

export const Scope: Model<DocModel> = model<DocModel>('Scope', schema);